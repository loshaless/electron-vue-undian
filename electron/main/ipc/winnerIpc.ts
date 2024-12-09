import { ipcMain } from "electron";
import { IpcChannels } from "../../../src/constants/enum/IpcChannels";
import { deleteWinnerData, getWinnerByCategory, getWinnerDetailByCategory, isWinnerDataExist, WinnerDetail } from "../database/winnerDB";
import { dialog } from "electron";
import fs from 'fs';
import { dbRun } from "../database/init";
import { deleteAllRollId } from "../database/customerDB";

ipcMain.on(IpcChannels.GET_WINNER_BY_CATEGORY, async (event, categoryId: number[]) => {
  try {
    const winner = await getWinnerByCategory(categoryId)
    event.reply(IpcChannels.GET_WINNER_BY_CATEGORY, winner)
  } catch (error) {
    dialog.showErrorBox('Error', 'Failed to get winner by category')
  }
})

ipcMain.on(IpcChannels.CREATE_TXT_REPORT, async (event, categoryId: number[]) => {
  try {
    const listOfWinner: WinnerDetail[] = await getWinnerDetailByCategory(categoryId)

    const header = "CIF|Name|Branch|Region|Points|Balance|Roll ID|Prize Name";
    const formattedData = [
      header,
      ...listOfWinner.map(winner => {
        return `${winner.cif}|${winner.name}|${winner.branch}|${winner.region}|${winner.points}|${winner.balance}|${winner.roll_id}|${winner.prize_name}`;
      })
    ].join('\n');

    const { filePath } = await dialog.showSaveDialog({
      title: 'Save Report',
      defaultPath: 'winner_report.txt',
      filters: [
        { name: 'Text Files', extensions: ['txt'] }
      ]
    });

    if (filePath) {
      fs.writeFile(filePath, formattedData, (err) => {
        if (err) throw err;
        console.log('The file has been saved!');
      });
    }
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to create txt repor:t ${error}`)
  }
})

ipcMain.on(IpcChannels.IS_WINNER_DATA_EXIST, async (event) => {
  try {
    const isExist = await isWinnerDataExist()
    event.reply(IpcChannels.IS_WINNER_DATA_EXIST, isExist)
  } catch (error) {
    dialog.showErrorBox('Error', `Failed to check winner data exist: ${error}`)
  }
})

ipcMain.on(IpcChannels.DELETE_WINNER_DATA, async (event) => {
  try {
    await dbRun(`BEGIN TRANSACTION`)
    const promises = []
    promises.push(deleteAllRollId())
    promises.push(deleteWinnerData())
    await Promise.all(promises)
    await dbRun(`COMMIT TRANSACTION`)

    event.reply(IpcChannels.DELETE_WINNER_DATA)
  } catch (error) {
    await dbRun(`ROLLBACK TRANSACTION`)
    dialog.showErrorBox('Error', `Failed to delete winner data: ${error}`)
  }
})
