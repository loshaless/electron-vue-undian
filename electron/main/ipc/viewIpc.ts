import { dialog, ipcMain } from "electron";
import { IpcChannels } from "../../../src/constants/ipcChannels";
import { windows } from "../index";

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

ipcMain.on(IpcChannels.START_ROLLING, (event) => {
  windows.view.webContents.send(IpcChannels.START_ROLLING);
});