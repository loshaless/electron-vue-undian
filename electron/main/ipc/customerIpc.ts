import { IpcChannels } from "../../../src/constants/ipcChannels";
import { ipcMain } from "electron";
import fs from "fs";
import readline from "readline";
import { db, dbRun } from "../database/init";
import { deleteCustomerData, resetCustomerSequence, isCustomerDataExist } from "../database/customerDB";

ipcMain.on(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, async (event, filePath) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  });

  let inserted = 0;
  const batchSize = 100; // Adjust the batch size as needed
  let batch = [];
  const insertPromises = [];
  let cumulativePoints = 0

  for await (const line of rl) {
    const [cif, account, name, branch, region, points, balance] = line.split("|");
    cumulativePoints += parseInt(points)
    batch.push([cif, account, name, branch, region, points, cumulativePoints, balance]);

    if (batch.length >= batchSize) {
      insertPromises.push(insertBatch(batch));
      inserted += batch.length;
      event.sender.send(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, inserted);
      batch = [];
    }
  }

  // Insert any remaining records in the last batch
  if (batch.length > 0) {
    insertPromises.push(insertBatch(batch));
    inserted += batch.length;
    event.sender.send(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, inserted);
  }

  // Wait for all insert operations to complete
  await Promise.all(insertPromises);

  console.log("File processing complete");
  event.sender.send(IpcChannels.UPLOAD_COMPLETE, inserted);
  event.sender.send(IpcChannels.IS_CUSTOMER_DATA_EXIST, true);

  async function insertBatch(batch) {
    return new Promise<void>((resolve, reject) => {
      const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
      const values = batch.flat();
      const sql = `INSERT INTO customer (cif, account, name, branch, region, points, cumulative_points, balance) VALUES ${placeholders}`;

      db.run(sql, values, (err) => {
        if (err) {
          console.error("Error inserting batch:", err.message);
          reject(err);
        } else {
          console.log(`Batch of ${batch.length} records inserted successfully`);
          resolve();
        }
      });
    });
  }
});

ipcMain.on(IpcChannels.DELETE_CUSTOMER_IN_DATABASE, async (event) => {
  try {
    await dbRun('BEGIN TRANSACTION');

    await deleteCustomerData();
    console.log("All data deleted successfully");

    await resetCustomerSequence();
    console.log("ID sequence reset successfully");

    await dbRun('COMMIT');
    event.sender.send(IpcChannels.IS_CUSTOMER_DATA_EXIST, false);
  } catch (err) {
    console.error("Error:", err.message);
    event.sender.send(IpcChannels.IS_CUSTOMER_DATA_EXIST, true);
    await dbRun('ROLLBACK');
  }
});

ipcMain.on(IpcChannels.IS_CUSTOMER_DATA_EXIST, async (event) => {
  try {
    const isExist = await isCustomerDataExist()
    event.sender.send(IpcChannels.IS_CUSTOMER_DATA_EXIST, isExist)
  } catch (error) {
    console.error("Error checking if data exists:", error.message);
    event.sender.send(IpcChannels.IS_CUSTOMER_DATA_EXIST, false);
  }
});