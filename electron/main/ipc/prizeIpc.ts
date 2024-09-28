import { ipcMain } from "electron";
import { IpcChannels } from "../../../src/constants/enum/IpcChannels";
import { addPrize, deletePrize, editPrize, isPrizeDataExist, getAllPrizeJoinRegion, AllPrizeJoinRegion } from "../database/prizeDB";
import { addPrizeRegion, editPrizeRegion, deletePrizeRegion } from "../database/prize_regionDB";
import { dialog } from "electron";
import { PrizeDetail, PrizeRegionDetail } from "../../../src/constants/types/PrizeDetail";
import { dbRun } from "../database/init";

ipcMain.on(IpcChannels.ADD_PRIZE, async (event, { name }) => {
  try {
    await addPrize(name);
    console.log("Prize added successfully");
    event.sender.send(IpcChannels.ADD_PRIZE);
    event.sender.send(IpcChannels.IS_PRIZE_DATA_EXIST, true)
  } catch (err) {
    dialog.showErrorBox("Error", `Error adding prize: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.GET_PRIZE, async (event) => {
  try {
    const rows: AllPrizeJoinRegion[] = await getAllPrizeJoinRegion();
    const listPrizeDetail: PrizeDetail[] = transformData(rows);
    event.sender.send(IpcChannels.GET_PRIZE, listPrizeDetail);
  } catch (err) {
    dialog.showErrorBox("Error", `Error fetching prize: ${err.message}`);
  }
});

function transformData(data: AllPrizeJoinRegion[]){
  return data.reduce((acc: PrizeDetail[], item: AllPrizeJoinRegion) => {
    let prize = acc.find(p => p.prizeId === item.id);
    if (!prize) {
      prize = {
        prizeId: item.id,
        prizeName: item.prize_name,
        regions: []
      };
      acc.push(prize);
    }
    prize.regions.push({
      prizeRegionId: item.prize_region_id,
      regionId: item.region_id,
      regionName: item.region_name,
      numOfItem: item.num_of_item,
    });
    return acc;
  }, []);
}

ipcMain.on(IpcChannels.DELETE_PRIZE, async (event, id) => {
  try {
    await deletePrize(id);
    const isExist = await isPrizeDataExist();
    if (!isExist) {
      console.log("all prize data deleted");
      event.sender.send(IpcChannels.IS_PRIZE_DATA_EXIST, false)
    }

    console.log("Prize deleted successfully");
    event.sender.send(IpcChannels.DELETE_PRIZE);
  } catch (err) {
    dialog.showErrorBox("Error", `Error deleting prize: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.EDIT_PRIZE, async (
  event, prizeDetail: PrizeDetail, 
  editedPrizeRegion: PrizeRegionDetail[], 
  addedPrizeRegion: PrizeRegionDetail[], 
  deletedPrizeRegion: number[]
) => {
  try {
    await dbRun('BEGIN TRANSACTION');
    await editPrize(prizeDetail.prizeId, prizeDetail.prizeName);

    const promises = [];

    // edit prize_region
    editedPrizeRegion.forEach((region) => {
      promises.push(editPrizeRegion(region.prizeRegionId, prizeDetail.prizeId, region.regionId, region.numOfItem));
    });

    // delete prize_region
    deletedPrizeRegion.forEach((prizeRegionId) => {
      promises.push(deletePrizeRegion(prizeRegionId));
    });

    // add prize_region
    addedPrizeRegion.forEach((region) => {
      promises.push(addPrizeRegion(prizeDetail.prizeId, region.regionId, region.numOfItem));
    });

    await Promise.all(promises);
    await dbRun('COMMIT');
    event.sender.send(IpcChannels.EDIT_PRIZE);
  } catch (err) {
    await dbRun('ROLLBACK');
    dialog.showErrorBox("Error", `Error editing prize: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.IS_PRIZE_DATA_EXIST, async (event) => {
  const isExist = await isPrizeDataExist();
  event.sender.send(IpcChannels.IS_PRIZE_DATA_EXIST, isExist);
});
