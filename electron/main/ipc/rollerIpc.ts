import { dbRun } from "../database/init";
import { ipcMain } from "electron";
import {
  findCustomerById,
  updateCustomerRollId
} from "../database/customerDB";
import { getMaxCumulativePoints, findCustomerByCumulativePoints } from "../database/dynamicDB";
import { addWinner } from "../database/winnerDB";
import { WinnerView } from "../../../src/constants/types/WinnerView";
import { IpcChannels } from "../../../src/constants/enum/IpcChannels";

ipcMain.on(IpcChannels.GET_A_WINNER, async (event, winnerView: WinnerView, database: string) => {
  try {
    await dbRun('BEGIN TRANSACTION');
    const maxCumulativePoints = await getMaxCumulativePoints(database);

    while (true) {
      const randomRollNumber = Math.floor(Math.random() * maxCumulativePoints) + 1;
      console.log("Random roll number:", randomRollNumber);
      const winnerRoll = await findCustomerByCumulativePoints(database, randomRollNumber);
      console.log("winnerRoll - ", winnerRoll);
      const winnerCustomer = await findCustomerById(winnerRoll.customer_id);
      console.log("winnerCustomer - ", winnerCustomer);

      if (winnerCustomer.roll_id === null) {
        const rollId = winnerCustomer.cumulative_points - (winnerRoll.cumulative_points - randomRollNumber)
        await updateCustomerRollId(winnerRoll.customer_id, rollId);

        winnerView.rollId = rollId
        winnerView.winnerName = winnerCustomer.name
        winnerView.region = winnerCustomer.region
        await addWinner(winnerView.prizeName, winnerView.rollId, winnerRoll.customer_id, winnerView.winnerName, winnerCustomer.region, winnerView.category)
        await dbRun("COMMIT");

        event.reply(IpcChannels.GET_A_WINNER, winnerView)
        break
      }
      else {
        console.log("Winner already picked");
      }
    }
  } catch (error) {
    await dbRun("ROLLBACK");
    throw new Error(`err createWinner: ${error}`)
  }
})