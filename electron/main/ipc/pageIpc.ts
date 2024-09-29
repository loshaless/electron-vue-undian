import { ipcMain } from "electron"
import { IpcChannels } from "../../../src/constants/enum/IpcChannels"
import { windows } from "..";

ipcMain.on(IpcChannels.CHANGE_PAGE, (event, pageName) => {
  windows.view.webContents.send(IpcChannels.CHANGE_PAGE, pageName);
})