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
import { editPrizeRegionNumOfItemByPrizeIdAndRegionId } from "../database/prize_regionDB";

ipcMain.on(IpcChannels.GET_A_WINNER, async (event, winnerView: WinnerView, database: string) => {
  try {
    await dbRun('BEGIN TRANSACTION');
    const maxCumulativePoints = await getMaxCumulativePoints(database);

    while (true) {
      const randomRollNumber = Math.floor(Math.random() * maxCumulativePoints) + 1;
      const winnerRoll = await findCustomerByCumulativePoints(database, randomRollNumber);
      const winnerCustomer = await findCustomerById(winnerRoll.customer_id);

      if (winnerCustomer.roll_id === null) {
        const rollId = winnerCustomer.cumulative_points - (winnerRoll.cumulative_points - randomRollNumber)
        await updateCustomerRollId(winnerRoll.customer_id, rollId);

        /* this data used for winner view in the second window */
        winnerView.rollId = rollId
        winnerView.winnerName = winnerCustomer.name

        await addWinner(winnerView.prizeName, winnerView.rollId, winnerRoll.customer_id, winnerView.winnerName, winnerCustomer.region, winnerView.categoryId)
        await editPrizeRegionNumOfItemByPrizeIdAndRegionId(winnerView.prizeId, winnerView.regionId)
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