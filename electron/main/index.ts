import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { IpcChannels } from "../../src/constants/ipcChannels";
import fs from "node:fs";
import readline from "node:readline";
import sqlite3 from "sqlite3";
import { promisify } from 'util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let windows = {
  main: null,
  view: null
};
const preload = path.join(__dirname, "../preload/index.mjs");
const DBSOURCE = "db.sqlite";

let db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customer (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cif TEXT,
      account TEXT,
      name TEXT,
      branch TEXT,
      region TEXT,
      points INTEGER,
      cumulative_points INTEGER,
      balance INTEGER,
      roll_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS prize (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      detail TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS roll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      points INTEGER,
      cumulative_points INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS winner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prize_name TEXT,
      roll_id INTEGER,
      customer_name TEXT,
      region TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  });
});

// Convert db.all and db.get to return Promises
const dbAll = promisify(db.all).bind(db);
const dbGet = promisify(db.get).bind(db);
const dbRun = promisify(db.run).bind(db);

async function createWindow(html = "index.html", referenceName = "main", x = 0, y = 0) {
  const win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload
    },
    autoHideMenuBar: true,
    x,
    y
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    await win.loadURL(path.posix.join(process.env.VITE_DEV_SERVER_URL, html));
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    await win.loadFile(path.join(__dirname, `../../dist/${html}`));
  }
  windows[referenceName] = win;
}

app.whenReady().then(() => {
  createWindow();
  createWindow("secondWindow.html", "view", 300, 100);
});

app.on("window-all-closed", () => {
  windows.main = null;
  windows.view = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// IPC HANDLER
ipcMain.on(IpcChannels.OPEN_FILE_DIALOG, (event) => {
  const result = dialog.showOpenDialogSync({
    properties: ["openFile"],
    filters: [{ name: "Text Files", extensions: ["txt"] }],
  });

  console.log("Dialog result:", result); // Debug log

  if (result?.length > 0) {
    event.sender.send(IpcChannels.SELECTED_FILE, result[0]);
  }
});

ipcMain.on(IpcChannels.UPLOAD_DATA_TO_DATABASE, async (event, filePath) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let inserted = 0;
  const batchSize = 100; // Adjust the batch size as needed
  let batch = [];
  const insertPromises = [];
  let cumulativePoints = 0

  for await (const line of rl) {
    const [cif, account, name, branch, region, points, balance] = line.split("|");
    cumulativePoints += parseInt(points)
    batch.push([cif, account, name, branch, region, points, cumulativePoints, balance]);

    if (batch.length >= batchSize) {
      insertPromises.push(insertBatch(batch));
      inserted += batch.length;
      event.sender.send(IpcChannels.UPLOAD_DATA_TO_DATABASE, inserted);
      batch = [];
    }
  }

  // Insert any remaining records in the last batch
  if (batch.length > 0) {
    insertPromises.push(insertBatch(batch));
    inserted += batch.length;
    event.sender.send(IpcChannels.UPLOAD_DATA_TO_DATABASE, inserted);
  }

  // Wait for all insert operations to complete
  await Promise.all(insertPromises);

  console.log("File processing complete");
  event.sender.send(IpcChannels.UPLOAD_COMPLETE, inserted);
  event.sender.send(IpcChannels.IS_DATA_EXIST, true);

  async function insertBatch(batch) {
    return new Promise<void>((resolve, reject) => {
      const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
      const values = batch.flat();
      const sql = `INSERT INTO customer (cif, account, name, branch, region, points, cumulative_points, balance) VALUES ${placeholders}`;

      db.run(sql, values, (err) => {
        if (err) {
          console.error("Error inserting batch:", err.message);
          reject(err);
        } else {
          console.log(`Batch of ${batch.length} records inserted successfully`);
          resolve();
        }
      });
    });
  }
});

async function deleteAllRollData(){
  try{
    await dbRun(`DELETE FROM roll`);
    await dbRun(`DELETE FROM sqlite_sequence WHERE name='roll'`);
    console.log("All roll data deleted successfully");
  } catch (err) {
    console.error("Error deleting roll data:", err.message);
  }
}

ipcMain.on(IpcChannels.DELETE_DATA_IN_DATABASE, (event) => {
  db.run(`DELETE FROM customer`, (err) => {
    if (err) {
      console.error("Error deleting data:", err.message);
    } else {
      console.log("All data deleted successfully");
      db.run(`DELETE FROM sqlite_sequence WHERE name='customer'`, (err) => {
        if (err) {
          console.error("Error resetting sequence:", err.message);
        } else {
          console.log("ID sequence reset successfully");
          event.sender.send(IpcChannels.IS_DATA_EXIST, false);
        }
      });
    }
  });
});

ipcMain.on(IpcChannels.IS_DATA_EXIST, (event) => {
  db.get("SELECT name FROM customer limit 1", (err, row) => {
    if (err) {
      console.error("Error checking if data exists:", err.message);
      event.sender.send(IpcChannels.IS_DATA_EXIST, false);
    } else {
      event.sender.send(IpcChannels.IS_DATA_EXIST, row !== undefined);
    }
  });
});

ipcMain.on(IpcChannels.START_ROLLING, (event) => {
  windows.view.webContents.send(IpcChannels.START_ROLLING);
});

ipcMain.on(IpcChannels.SET_A_WINNER, (event) => {
  windows.view.webContents.send(IpcChannels.SET_A_WINNER, { 
    name: 'John Doe',
    winnerDigits: [1, 2, 3, 4, 5, 6, 7, 8, 9]
   });
});

ipcMain.on(IpcChannels.ADD_PRIZE, (event, {name, detail}) => {
  db.run(`INSERT INTO prize (name, detail) VALUES (?, ?)`, [name, detail], (err) => {
    if (err) {
      console.error("Error adding prize:", err.message);
    } else {
      console.log("Prize added successfully");
      event.sender.send(IpcChannels.ADD_PRIZE)
    }
  });
});

ipcMain.on(IpcChannels.GET_PRIZE, (event) => {
  db.all(`SELECT * FROM prize`, (err, rows) => {
    if (err) {
      console.error("Error fetching prize:", err.message);
    } else {
      event.sender.send(IpcChannels.GET_PRIZE, rows);  
    }
  });
});

ipcMain.on(IpcChannels.DELETE_PRIZE, (event, id) => {
  db.run(`DELETE FROM prize WHERE id = ?`, [id], (err) => {
    if (err) {
      console.error("Error deleting prize:", err.message);
    } else {
      console.log("Prize deleted successfully");
      event.sender.send(IpcChannels.DELETE_PRIZE);
    }
  })
})

ipcMain.on(IpcChannels.EDIT_PRIZE, (event, {id, name, detail}) => {
  db.run(`UPDATE prize SET name = ?, detail = ? WHERE id = ?`, [name, detail, id], (err) => {
    if (err) {
      console.error("Error editing prize:", err.message);
    } else {
      console.log("Prize edited successfully");
      event.sender.send(IpcChannels.EDIT_PRIZE);
    }
  })
})

ipcMain.on(IpcChannels.PICK_WINNER, async (event, { minBalance, region, numOfWinner, prizeName }) => {
  try {
    const sql = `
      SELECT id, points
      FROM customer
      WHERE balance >= ? AND region = ? AND roll_id IS NULL
    `;
    const rows = await dbAll(sql, [minBalance, region]);
    console.log(rows);

    // Calculate cumulative points manually
    let cumulativePoints = 0;
    const insertData = rows.map(row => {
      cumulativePoints += row.points;
      return [row.id, row.points, cumulativePoints];
    });

    // Insert data in batches
    const batchSize = 100; // Adjust the batch size as needed
    const totalBatches = Math.ceil(insertData.length / batchSize);
    console.log(totalBatches);
    await dbRun("BEGIN TRANSACTION");

    for (let i = 0; i < totalBatches; i++) {
      const batch = insertData.slice(i * batchSize, (i + 1) * batchSize);
      const placeholders = batch.map(() => "(?, ?, ?)").join(", ");
      const values = batch.flat();
      const rollSql = `
        INSERT INTO roll (customer_id, points, cumulative_points) VALUES ${placeholders}
      `;
      await dbRun(rollSql, values);
    }

    await dbRun("COMMIT");
    console.log("Roll data inserted successfully");

    // Get max cumulative points
    const row = await dbGet("SELECT cumulative_points FROM roll ORDER BY id DESC LIMIT 1");
    console.log(row);
    
    const maxCumulativePoints = row.cumulative_points;
    console.log("Max cumulative points:", maxCumulativePoints);

    // Get random winners
    for (let i = 0; i < numOfWinner; i++) {
      const randomRollNumber = Math.floor(Math.random() * maxCumulativePoints) + 1;
      console.log("Random roll number:", randomRollNumber);

      const winnerRoll = await dbGet(`SELECT points, cumulative_points, customer_id FROM roll WHERE cumulative_points > ?`, [randomRollNumber]);
      const winnerCustomer = await dbGet(`SELECT * FROM customer WHERE id = ?`, [winnerRoll.customer_id]);

      if(winnerCustomer.roll_id === null){
        const rollId = winnerCustomer.cumulative_points - (winnerRoll.cumulative_points - randomRollNumber)
        const updateSql = `UPDATE customer SET roll_id = ? WHERE id = ?`;
        await dbRun(updateSql, [
          rollId, 
          winnerRoll.customer_id]
        );

        const insertWinnerSql = `INSERT INTO winner (prize_name, roll_id, customer_name, region) VALUES (?, ?, ?, ?)`;
        await dbRun(insertWinnerSql, [prizeName, rollId, winnerCustomer.name, winnerCustomer.region]);
      }
      else {
        console.log("Winner already picked");
        i -= 1;
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    deleteAllRollData();
  }
});