import {ipcMain} from "electron";
import {IpcChannels} from "../../../src/constants/enum/IpcChannels";
import {addPrize, getPrizes, deletePrize, editPrize} from "../database/prizeDB";
import {dialog} from "electron";

ipcMain.on(IpcChannels.ADD_PRIZE, async (event, {name, detail}) => {
  try {
    await addPrize(name, detail);
    console.log("Prize added successfully");
    event.sender.send(IpcChannels.ADD_PRIZE);
  } catch (err) {
    dialog.showErrorBox("Error", `Error adding prize: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.GET_PRIZE, async (event) => {
  try {
    const rows = await getPrizes();
    event.sender.send(IpcChannels.GET_PRIZE, rows);
  } catch (err) {
    dialog.showErrorBox("Error", `Error fetching prize: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.DELETE_PRIZE, async (event, id) => {
  try {
    await deletePrize(id);
    console.log("Prize deleted successfully");
    event.sender.send(IpcChannels.DELETE_PRIZE);
  } catch (err) {
    dialog.showErrorBox("Error", `Error deleting prize: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.EDIT_PRIZE, async (event, {id, name, detail}) => {
  try {
    await editPrize(id, name, detail);
    console.log("Prize edited successfully");
    event.sender.send(IpcChannels.EDIT_PRIZE);
  } catch (err) {
    dialog.showErrorBox("Error", `Error editing prize: ${err.message}`);
  }
});