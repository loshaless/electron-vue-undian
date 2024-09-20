import { ipcMain } from "electron";
import { IpcChannels } from "../../../src/constants/IpcChannels";
import { getWinnerByCategory } from "../database/winnerDB";
import { dialog } from "electron";

ipcMain.on(IpcChannels.GET_WINNER_BY_CATEGORY, async (event, categoryId: number[]) => {
  try {
    const winner = await getWinnerByCategory(categoryId)
    event.reply(IpcChannels.GET_WINNER_BY_CATEGORY, winner)
  } catch (error) {
    dialog.showErrorBox('Error', 'Failed to get winner by category')
  }
})
