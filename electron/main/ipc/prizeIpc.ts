import { ipcMain } from "electron";
import { IpcChannels } from "../../../src/constants/ipcChannels";
import { addPrize, getPrizes, deletePrize, editPrize } from "../database/prizeDB";

ipcMain.on(IpcChannels.ADD_PRIZE, async (event, { name, detail }) => {
  try {
    await addPrize(name, detail);
    console.log("Prize added successfully");
    event.sender.send(IpcChannels.ADD_PRIZE);
  } catch (err) {
    console.error("Error adding prize:", err.message);
  }
});

ipcMain.on(IpcChannels.GET_PRIZE, async (event) => {
  try {
    const rows = await getPrizes();
    event.sender.send(IpcChannels.GET_PRIZE, rows);
  } catch (err) {
    console.error("Error fetching prize:", err.message);
  }
});

ipcMain.on(IpcChannels.DELETE_PRIZE, async (event, id) => {
  try {
    await deletePrize(id);
    console.log("Prize deleted successfully");
    event.sender.send(IpcChannels.DELETE_PRIZE);
  } catch (err) {
    console.error("Error deleting prize:", err.message);
  }
});

ipcMain.on(IpcChannels.EDIT_PRIZE, async (event, { id, name, detail }) => {
  try {
    await editPrize(id, name, detail);
    console.log("Prize edited successfully");
    event.sender.send(IpcChannels.EDIT_PRIZE);
  } catch (err) {
    console.error("Error editing prize:", err.message);
  }
});