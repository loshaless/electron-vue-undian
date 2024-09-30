import { ipcMain } from "electron";
import { IpcChannels } from "../../../src/constants/enum/IpcChannels";

import { dialog } from "electron";
import { getCategoryJoinPrize, editCategory } from "../database/categoryDB";
import { dbRun } from "../database/init";
import { editCategoryPrize } from "../database/prizeDB";

interface EditCategory {
  id: number;
  minBalance: number;
}

interface EditCategoryPrize {
  prizeId: number;
  categoryId: number;
}

ipcMain.on(IpcChannels.SAVE_CATEGORY, async (
  event,
  edittedCategories: EditCategory[],
  edittedCategoryPrizes: EditCategoryPrize[]
) => {
  try {
    await dbRun(`BEGIN TRANSACTION`);
    console.log(edittedCategories);
    console.log(edittedCategoryPrizes);
    const categoryPromises = edittedCategories.map((category) => {
      editCategory(category.id, category.minBalance);
    });

    const prizePromises = edittedCategoryPrizes.map((categoryPrize) => {
      editCategoryPrize(categoryPrize.prizeId, categoryPrize.categoryId);
    });

    await Promise.all(categoryPromises);
    await Promise.all(prizePromises);

    console.log("Category added successfully");
    event.sender.send(IpcChannels.SAVE_CATEGORY);
    await dbRun(`COMMIT`);
  } catch (err) {
    await dbRun(`ROLLBACK`);
    dialog.showErrorBox("Error", `Error adding category: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.GET_CATEGORY, async (event) => {
  try {
    const rows = await getCategoryJoinPrize();
    event.sender.send(IpcChannels.GET_CATEGORY, transformData(rows));
  } catch (err) {
    dialog.showErrorBox("Error", `Error fetching category: ${err.message}`);
  }
})

function transformData(data: any[]) {
  return data.reduce((acc, item) => {
    let category = acc.find(c => c.id === item.id);
    if (!category) {
      category = {
        id: item.id,
        name: item.name,
        minBalance: item.min_balance,
        prizes: []
      };
      acc.push(category);
    }
    if (item.prize_id) {
      category.prizes.push(item.prize_id);
    }
    return acc;
  }, []);
}