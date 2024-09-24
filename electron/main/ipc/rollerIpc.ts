import {dbRun} from "../database/init";
import {IpcChannels} from "../../../src/constants/IpcChannels";
import {ipcMain} from "electron";
import {
  deleteAllRollData,
  findRollByCumulativePoints,
} from "../database/rollDB";
import {
  findCustomerById,
  getCustomerDataByBalanceAndRegion,
  updateCustomerRollId
} from "../database/customerDB";
import {dialog} from "electron";
import {addWinner} from "../database/winnerDB";
import {WinnerRequirement} from "../../../src/constants/WinnerRequirement"
import {WinnerView} from "../../../src/constants/WinnerView";

async function migrateCustomerToRollByBalanceAndRegionThenReturnCumulativePoints(minBalance: number, region: string): Promise<number> {
  try {
    const batchSize = 4000; // adjust based on memory constraints
    let offset = 0
    let cumulativePoints = 0;

    while (true) {
      const customers = await getCustomerDataByBalanceAndRegion(minBalance, region, batchSize, offset)
      if (customers.length === 0) return cumulativePoints

      // Prepare the INSERT statement
      const insertPromises = customers.map(customer => {
        cumulativePoints += customer.points; // Update cumulative points
        return dbRun(`INSERT INTO roll (customer_id, points, cumulative_points) VALUES (?, ?, ?)`, [customer.customer_id, customer.points, cumulativePoints]);
      });

      await Promise.all(insertPromises);
      offset += batchSize;
      console.log(`Processed ${offset} customers.`);
    }
  } catch (error) {
    throw new Error(`Migration failed: , ${error}`);
  }
}

async function createWinner(requirement: WinnerRequirement): Promise<WinnerView[]> {
  const {minBalance, region, numOfWinner, prizeName, category} = requirement
  const winner: WinnerView[] = []

  try {
    await dbRun('BEGIN TRANSACTION');

    // Get max cumulative points
    const maxCumulativePoints
      = await migrateCustomerToRollByBalanceAndRegionThenReturnCumulativePoints(minBalance, region);
    console.log("Max cumulative points:", maxCumulativePoints);

    // Get random winners
    for (let i = 0; i < numOfWinner; i++) {
      const randomRollNumber = Math.floor(Math.random() * maxCumulativePoints) + 1;
      console.log("Random roll number:", randomRollNumber);
      const winnerRoll = await findRollByCumulativePoints(randomRollNumber);
      console.log("winnerRoll - ", winnerRoll);
      const winnerCustomer = await findCustomerById(winnerRoll.customer_id);
      console.log("winnerCustomer - ", winnerCustomer);

      if (winnerCustomer.roll_id === null) {
        const rollId = winnerCustomer.cumulative_points - (winnerRoll.cumulative_points - randomRollNumber)
        await updateCustomerRollId(winnerRoll.customer_id, rollId);

        winner.push({
          prizeName, rollId, winnerName: winnerCustomer.name, category
        })
        await addWinner(prizeName, rollId, winnerCustomer.name, winnerCustomer.region, category);
      } else {
        console.log("Winner already picked");
        i -= 1;
      }
    }
    await dbRun("COMMIT");

    return winner
  } catch (err) {
    await dbRun("ROLLBACK");
    throw new Error(`err createWinner: ${err}`)
  } finally {
    await deleteAllRollData();
  }
}

ipcMain.on(IpcChannels.INITIATE_WINNER, async (event, requirement: WinnerRequirement[]) => {
  try {
    let listOfWinner: WinnerView[] = []
    for (let i = 0; i < requirement.length; i++) {
      const winner: WinnerView[] = await createWinner(requirement[i])
      listOfWinner = [...listOfWinner, ...winner]
    }

    event.sender.send(IpcChannels.INITIATE_WINNER, listOfWinner);
  } catch (error) {
    event.sender.send(IpcChannels.INITIATE_WINNER, []);
    dialog.showErrorBox("Error", `An error occurred: ${error.message}`);
  }
});