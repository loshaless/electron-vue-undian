import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { IpcChannels } from "../../src/constants/ipcChannels";
import "./ipc/customerIpc";
import "./ipc/prizeIpc";
import "./ipc/viewIpc";
import "./config/logger";
import fs from "node:fs";
import { dbAll, dbGet, dbRun } from "./database/init";
import { deleteAllRollData } from "./database/rollDB";

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

// Create a writable stream to the log file
const logFile = path.join(process.env.APP_ROOT || __dirname, "app.log");
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Save the original console.log function
const originalConsoleLog = console.log;

// Override console.log to also write to the log file
console.log = (...args) => {
  // Get the current timestamp
  const now = new Date();
  const timestamp = now.toLocaleString('en-US', { timeZoneName: 'short' });

  // Format the log message
  const logMessage = args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg) : arg)).join(' ');
  const logEntry = `[${timestamp}] ${logMessage}\n`;

  // Write to console and log file
  originalConsoleLog(...args);
  logStream.write(logEntry);
};

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

export const windows = {
  main: null,
  view: null
};
const preload = path.join(__dirname, "../preload/index.mjs");

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
  app.quit();
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