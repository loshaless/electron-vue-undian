import { ipcMain } from "electron";
import { addRegion, deleteRegion, getRegions } from "../database/regionDB";
import { IpcChannels } from "../../../src/constants/enum/IpcChannels";

ipcMain.on(IpcChannels.GET_REGION_DATA, async (event) => {
  console.log('GET_REGION_DATA')
  try {
    const regionData = await getRegions()
    event.sender.send(IpcChannels.GET_REGION_DATA, regionData)
  } catch (err) {
    window.alert(err)
  }
})

ipcMain.on(IpcChannels.ADD_REGION_DATA, async (event, regionData) => {
  try {
    await addRegion(regionData)
    event.sender.send(IpcChannels.ADD_REGION_DATA, true)
  } catch (err) {
    window.alert(err)
  }
})

ipcMain.on(IpcChannels.DELETE_REGION_DATA, async (event, id: number) => {
  try {
    await deleteRegion(id)
    event.sender.send(IpcChannels.DELETE_REGION_DATA, true)
  } catch (err) {
    window.alert(err)
  }
})
