import { dbRun } from "../database/init";
import { IpcChannels } from "../../../src/constants/ipcChannels";
import { ipcMain } from "electron";
import { 
  deleteAllRollData, 
  findRollByCumulativePoints, 
} from "../database/rollDB";
import { 
  findCustomerById, 
  getCustomerDataByBalanceAndRegion, 
  updateCustomerRollId
} from "../database/customerDB";
import { dialog } from "electron";
import { addWinner } from "../database/winnerDB";

async function migrateCustomerToRollByBalanceAndRegionThenReturnCumulativePoints(minBalance:number, region: string): Promise<number>{
  try {
    const batchSize = 10000; // adjust based on memory constraints
    let offset = 0
    let cumulativePoints = 0;

    while(true) {
      const customers = await getCustomerDataByBalanceAndRegion(minBalance, region, batchSize, offset)
      if(customers.length === 0) return cumulativePoints

      // Prepare the INSERT statement
      const insertPromises = customers.map(customer => {
        cumulativePoints += customer.points; // Update cumulative points
        return dbRun(`INSERT INTO roll (customer_id, points, cumulative_points) VALUES (?, ?, ?)`, [customer.customer_id, customer.points, cumulativePoints]);
      });

      await Promise.all(insertPromises);
      offset += batchSize;
      console.log(`Processed ${customers.length} customers.`);
    }
  } catch (error) {
    deleteAllRollData()
    console.error('Migration failed:', error);
  }
}

ipcMain.on(IpcChannels.PICK_WINNER, async (event, { minBalance, region, numOfWinner, prizeName }) => {
  try {    
    await dbRun('BEGIN TRANSACTION')

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

      if(winnerCustomer.roll_id === null){
        const rollId = winnerCustomer.cumulative_points - (winnerRoll.cumulative_points - randomRollNumber)
        await updateCustomerRollId(winnerRoll.customer_id, rollId);
        await addWinner(prizeName, rollId, winnerCustomer.name, winnerCustomer.region);
      }
      else {
        console.log("Winner already picked");
        i -= 1;
      }
    }
    await dbRun("COMMIT");
  } catch (err) {
    await dbRun("ROLLBACK");
    dialog.showErrorBox("Error", `An error occurred: ${err.message}`);
  } finally {
    deleteAllRollData();
  }
});