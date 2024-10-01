import { ipcMain } from "electron"
import { windows } from ".."
import { IpcChannels } from "../../../src/constants/enum/IpcChannels"

/* WINNER VIEW PAGE SETTINGS */
ipcMain.on(IpcChannels.WINNER_PAGE_SET_CATEGORY, async (event, settings) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_SET_CATEGORY, settings)
})

ipcMain.on(IpcChannels.WINNER_PAGE_SET_SCROLL_TIME, async (event, settings) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_SET_SCROLL_TIME, settings)
})

ipcMain.on(IpcChannels.WINNER_PAGE_START_SCROLL, async (event, settings) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_START_SCROLL, settings)
})

ipcMain.on(IpcChannels.WINNER_PAGE_STOP_SCROLL, async (event, settings) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_STOP_SCROLL, settings)
})

ipcMain.on(IpcChannels.WINNER_PAGE_GET_PROGRESS, async (event, settings) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_GET_PROGRESS, settings)
})