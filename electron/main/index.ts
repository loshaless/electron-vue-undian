import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { IpcChannels } from "../../src/constants/ipcChannels";
import fs from "node:fs";
import readline from "node:readline";
import sqlite3 from "sqlite3";

const require = createRequire(import.meta.url);
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
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

const dbPath = path.join(process.env.APP_ROOT, "data.db");
const db = new sqlite3.Database(dbPath);

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

async function createWindow() {
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
    // #298
    await mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.webContents.send(
      "main-process-message",
      new Date().toLocaleString()
    );
  });

  // Make all links open with the browser, not with the application
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // mainWindow.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(() => createWindow());

app.on("window-all-closed", () => {
  mainWindow = null;
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
    createWindow();
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

ipcMain.on(IpcChannels.UPLOAD_DATA_TO_DATABASE, (event, filePath) => {
  console.log("Upload data to database:", filePath);

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  rl.on("line", (line) => {
    const [cif, account, name, branch, region, points, balance] =
      line.split("|");
    db.run(
      `INSERT INTO data (cif, account, name, branch, region, points, balance) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cif, account, name, branch, region, points, balance],
      (err) => {
        if (err) {
          console.error("Error inserting data:", err.message);
        } else {
          console.log("Data inserted successfully");
        }
      }
    );
  });

  rl.on("close", () => {
    console.log("File has been read");
  });

  event.sender.send(IpcChannels.IS_DATA_EXIST, false);
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
      event.sender.send(IpcChannels.DELETE_DATA_IN_DATABASE, {
        success: false,
      });
    } else {
      console.log("All data deleted successfully");
      event.sender.send(IpcChannels.DELETE_DATA_IN_DATABASE, { success: true });
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
