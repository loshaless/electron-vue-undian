import { dialog, ipcMain } from "electron";
import { getRegions, editRegion, addRegion, deleteRegion } from "../database/regionDB";
import { IpcChannels } from "../../../src/constants/enum/IpcChannels";
import { dbRun } from "../database/init";
import { Region } from "../../../src/constants/types/Region";

ipcMain.on(IpcChannels.GET_REGION_DATA, async (event) => {
  console.log('GET_REGION_DATA')
  try {
    const regionData = await getRegions()
    event.sender.send(IpcChannels.GET_REGION_DATA, regionData)
  } catch (err) {
    dialog.showErrorBox("Error", `Error get region data: ${err.message}`);
  }
})

ipcMain.on(IpcChannels.MASS_EDIT_REGION, async (event, editedRegion: Region[], addedRegion: string[], deletedRegion: number[]) => {
  try {
    await dbRun('BEGIN TRANSACTION');
    const promises = []
    editedRegion.forEach(async region => {
      promises.push(editRegion(region.id, region.name))
    })
    addedRegion.forEach(async region => {
      promises.push(addRegion(region))
    })
    deletedRegion.forEach(async id => {
      promises.push(deleteRegion(id))
    })
    await Promise.all(promises)
    await dbRun('COMMIT')
    event.sender.send(IpcChannels.MASS_EDIT_REGION, true)
  } catch (err) {
    await dbRun('ROLLBACK');
    dialog.showErrorBox("Error", `Error mass edit region: ${err.message}`);
  }
})
