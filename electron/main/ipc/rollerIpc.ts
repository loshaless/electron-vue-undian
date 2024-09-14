import { dbRun } from "../database/init";
import { IpcChannels } from "../../../src/constants/ipcChannels";
import { ipcMain } from "electron";
import { 
  deleteAllRollData, 
  findRollByCumulativePoints, 
  getMaxCumulativePoints 
} from "../database/rollDB";
import { 
  findCustomerById, 
  getCustomerDataByBalanceAndRegion, 
  updateCustomerRollId
} from "../database/customerDB";
import { dialog } from "electron";
import { addWinner } from "../database/winnerDB";

async function moveCustomerDataToRoll(insertData: any[]) {
  // Insert data in batches
  const batchSize = 100; // Adjust the batch size as needed
  const totalBatches = Math.ceil(insertData.length / batchSize);
  console.log(totalBatches);
  
  for (let i = 0; i < totalBatches; i++) {
    const batch = insertData.slice(i * batchSize, (i + 1) * batchSize);
    const placeholders = batch.map(() => "(?, ?, ?)").join(", ");
    const values = batch.flat();
    const rollSql = `
      INSERT INTO roll (customer_id, points, cumulative_points) VALUES ${placeholders}
    `;
    await dbRun(rollSql, values);
  }
  console.log("Roll data inserted successfully");
}

ipcMain.on(IpcChannels.PICK_WINNER, async (event, { minBalance, region, numOfWinner, prizeName }) => {
  try {    
    await dbRun("BEGIN TRANSACTION");
    const listOfCustomer = await getCustomerDataByBalanceAndRegion(minBalance, region);

    let cumulativePoints = 0;
    const insertData = listOfCustomer.map(row => {
      cumulativePoints += row.points;
      return [row.id, row.points, cumulativePoints];
    });

    await moveCustomerDataToRoll(insertData);

    // Get max cumulative points
    const {cumulative_points: maxCumulativePoints} = await getMaxCumulativePoints();
    console.log("Max cumulative points:", maxCumulativePoints);

    // Get random winners
    for (let i = 0; i < numOfWinner; i++) {
      const randomRollNumber = Math.floor(Math.random() * maxCumulativePoints) + 1;
      console.log("Random roll number:", randomRollNumber);

      const winnerRoll = await findRollByCumulativePoints(randomRollNumber);
      const winnerCustomer = await findCustomerById(winnerRoll.customer_id);

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