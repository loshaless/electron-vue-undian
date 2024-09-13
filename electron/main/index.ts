import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { IpcChannels } from "../../src/constants/ipcChannels";
import fs from "node:fs";
import readline from "node:readline";
import sqlite3 from "sqlite3";

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
    db.run(`CREATE TABLE IF NOT EXISTS data (
      cif TEXT,
      account TEXT,
      name TEXT,
      branch TEXT,
      region TEXT,
      points INTEGER,
      balance INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS prize (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      detail TEXT
    )`);
  });
});

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

  for await (const line of rl) {
    const [cif, account, name, branch, region, points, balance] =
      line.split("|");
    batch.push([cif, account, name, branch, region, points, balance]);

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
      const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?)").join(", ");
      const values = batch.flat();
      const sql = `INSERT INTO data (cif, account, name, branch, region, points, balance) VALUES ${placeholders}`;

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

ipcMain.on(IpcChannels.GET_ALL_DATA, (event) => {
  db.all(`SELECT * FROM data`, (err, rows) => {
    if (err) {
      console.error("Error fetching data:", err.message);
    } else {
      console.log("Data fetched successfully", rows);
      event.sender.send(IpcChannels.GET_ALL_DATA, rows);
    }
  });
});

ipcMain.on(IpcChannels.DELETE_DATA_IN_DATABASE, (event) => {
  db.run(`DELETE FROM data`, (err) => {
    if (err) {
      console.error("Error deleting data:", err.message);
    } else {
      console.log("All data deleted successfully");
      event.sender.send(IpcChannels.IS_DATA_EXIST, false);
    }
  });
});

ipcMain.on(IpcChannels.IS_DATA_EXIST, (event) => {
  db.get("SELECT name FROM data limit 1", (err, row) => {
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

ipcMain.on(IpcChannels.PICK_WINNER, (event, {minBalance, region, numOfWinner}) => {
  console.log(minBalance, region, numOfWinner);

  const sql = `
    SELECT * FROM data
    WHERE balance >= ? AND region = ?
    ORDER BY RANDOM()
    LIMIT ?
  `;

  db.all(sql, [minBalance, region, numOfWinner], (err, rows) => {
    if (err) {
      console.error("Error picking winners:", err.message);
      event.sender.send(IpcChannels.PICK_WINNER, { success: false, error: err.message });
    } else {
      console.log("Winners picked successfully", rows);
      event.sender.send(IpcChannels.PICK_WINNER, { success: true, winners: rows });
    }
  });
});