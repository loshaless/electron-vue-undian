import { ipcMain } from "electron"
import { IpcChannels } from "../../../src/constants/enum/IpcChannels"
import { windows } from "..";
import { getBackgroundImageByName, updateBackgroundImageByName } from "../database/backgroundImageDB";

ipcMain.on(IpcChannels.CHANGE_PAGE, (event, pageName) => {
  windows.view.webContents.send(IpcChannels.CHANGE_PAGE, pageName);
})

ipcMain.on(IpcChannels.GET_BACKGROUND_IMAGE, async (event, pageName) => {
  const imagePath = await getBackgroundImageByName(pageName)
  event.reply(IpcChannels.GET_BACKGROUND_IMAGE, imagePath.image_path)
})

ipcMain.on(IpcChannels.UPLOAD_IMAGE_TO_DB, async (event, imagePath, pageName) => {
  windows.view.webContents.send(IpcChannels.GET_BACKGROUND_IMAGE, imagePath)
  await updateBackgroundImageByName(imagePath, pageName)
})