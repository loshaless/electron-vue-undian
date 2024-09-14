import { app, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import "./ipc/customerIpc";
import "./ipc/prizeIpc";
import "./ipc/viewIpc";
import "./ipc/rollerIpc";
import fs from "node:fs";

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