import { app, BrowserWindow, ipcMain, dialog } from "electron";
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

let mainWindow: BrowserWindow | null = null;
let secondWindow: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");
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
  });
});

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(indexHtml);
  }
}

async function createSecondWindow() {
  secondWindow = new BrowserWindow({
    webPreferences: {
      preload,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    console.log("create second window")
    await secondWindow.loadURL(`${VITE_DEV_SERVER_URL}/secondWindow.html`);
    secondWindow.webContents.openDevTools();
  } else {
    await secondWindow.loadFile(path.join(RENDERER_DIST, "secondWindow.html"));
  }
}

app.whenReady().then(() => {
  createMainWindow();
  // createSecondWindow();
});

app.on("window-all-closed", () => {
  mainWindow = null;
  secondWindow = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (mainWindow) {
    // Focus on the main window if the user tried to open another
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createMainWindow();
    // createSecondWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
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
