import {dialog, ipcMain} from "electron";
import {IpcChannels} from "../../../src/constants/enum/IpcChannels";
import {windows} from "../index";
import {WinnerView} from "../../../src/constants/types/WinnerView";

ipcMain.on(IpcChannels.OPEN_FILE_DIALOG, (event) => {
  const result = dialog.showOpenDialogSync({
    properties: ["openFile"],
    filters: [{name: "Text Files", extensions: ["txt"]}],
  });

  console.log("Dialog result:", result); // Debug log

  if (result?.length > 0) {
    event.sender.send(IpcChannels.SELECTED_FILE, result[0]);
  } else {
    console.log("Dialog was closed without selecting a file."); // Debug log for closed dialog
    event.sender.send(IpcChannels.FILE_DIALOG_CLOSED);
  }
});

ipcMain.on(IpcChannels.START_ROLLING, (event) => {
  windows.view.webContents.send(IpcChannels.START_ROLLING);
});

ipcMain.on(IpcChannels.STOP_ROLLING, (event, winner: WinnerView) => {
  windows.view.webContents.send(IpcChannels.STOP_ROLLING, winner)
})