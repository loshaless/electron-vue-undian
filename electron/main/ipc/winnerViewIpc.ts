import { dialog, ipcMain } from "electron"
import { windows } from ".."
import { IpcChannels } from "../../../src/constants/enum/IpcChannels"
import { getWinnerDetailByCategory } from "../database/winnerDB"

/* WINNER VIEW PAGE SETTINGS */
ipcMain.on(IpcChannels.WINNER_PAGE_SET_CATEGORY, async (event, settings) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_SET_CATEGORY, settings)
})

ipcMain.on(IpcChannels.WINNER_PAGE_SET_SCROLL_TIME, async (event, settings) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_SET_SCROLL_TIME, settings)
})

ipcMain.on(IpcChannels.WINNER_PAGE_START_SCROLL, async (event) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_START_SCROLL)
})

ipcMain.on(IpcChannels.WINNER_PAGE_STOP_SCROLL, async (event) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_STOP_SCROLL)
})

ipcMain.on(IpcChannels.WINNER_PAGE_GET_PROGRESS, async (event, settings) => {
  windows.main.webContents.send(IpcChannels.WINNER_PAGE_GET_PROGRESS, settings)
})

ipcMain.on(IpcChannels.WINNER_PAGE_SET_HEIGHT_WIDTH, async (event, height, width) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_SET_HEIGHT_WIDTH, height, width)
})

ipcMain.on(IpcChannels.WINNER_PAGE_GET_WINNER_DETAIL_BY_CATEGORY, async (event, categoryId: number[]) => {
  try {
    const listOfWinner = await getWinnerDetailByCategory(categoryId)
    windows.view.webContents.send(IpcChannels.WINNER_PAGE_GET_WINNER_DETAIL_BY_CATEGORY, listOfWinner)
  } catch (error) {
    dialog.showErrorBox('Error', 'Failed to get winner detail by category')
  }
})

ipcMain.on(IpcChannels.WINNER_PAGE_RESTART_SCROLL, (event) => {
  windows.view.webContents.send(IpcChannels.WINNER_PAGE_RESTART_SCROLL)
})
