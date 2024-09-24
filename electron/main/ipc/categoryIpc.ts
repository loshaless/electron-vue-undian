import {ipcMain} from "electron";
import {IpcChannels} from "../../../src/constants/enum/IpcChannels";

import {dialog} from "electron";
import {massInsertCategory, dropCategoryTable, getCategory, createCategoryTable} from "../database/categoryDB";
    
ipcMain.on(IpcChannels.SAVE_CATEGORY, async (event, categories: any[]) => {
  try {
    await dropCategoryTable();
    await createCategoryTable();

    await massInsertCategory(categories);
    console.log("Category added successfully");
    event.sender.send(IpcChannels.SAVE_CATEGORY);
  } catch (err) {
    dialog.showErrorBox("Error", `Error adding category: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.GET_CATEGORY, async (event) => {
    try {
        const rows = await getCategory();
        event.sender.send(IpcChannels.GET_CATEGORY, rows);
    } catch (err) {
        dialog.showErrorBox("Error", `Error fetching category: ${err.message}`);
    }
})