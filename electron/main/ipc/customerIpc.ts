import { IpcChannels } from "../../../src/constants/enum/IpcChannels";
import { dialog, ipcMain } from "electron";
import fs from "fs";
import readline from "readline";
import { dbRun } from "../database/init";
import { dropCustomerTable, createCustomerTable, isCustomerDataExist, getTotalCumulativePoints, massInsertCustomer } from "../database/customerDB";
import { windows } from "..";
import { CustomerTable } from "../../../src/constants/types/CustomerTable";
import { createTable, dropTable, getMaxCumulativePoints, getTotalCustomer, massInsert } from "../database/dynamicDB";
import { addTempTableName, createTempTableNameTable, dropTempTableName, getTempTableName } from "../database/tempTableNameDB";

async function initAllCustomerTable(conditions: CustomerTable[]) {
  const createPromises = []

  for (const condition of conditions) {
    createPromises.push(createTable(condition.tableName))
    createPromises.push(addTempTableName(condition.tableName))
  }
  await Promise.all(createPromises);
}

let arrayOfCumulativePoints = []
async function insertBatch(batchs: any[], conditions: CustomerTable[]): Promise<void> {
  const arrayOfBatch = Array.from({ length: conditions.length }, () => []);

  for (const batch of batchs) {
    const [customer_id, cif, account, name, branch, region, points, cumulative_points, balance] = batch

    // insert to array of batch
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i]
      if (condition.minBalance <= balance && (condition.regions === "All Region" || condition.regions === region)) {
        arrayOfCumulativePoints[i] += points
        arrayOfBatch[i].push([customer_id, points, arrayOfCumulativePoints[i]])
      }
    }
  }

  const promises = []
  // insert all batchs to customer table
  promises.push(massInsertCustomer(batchs))

  // Insert array of batch to dynamic table, name follow condition
  for (let i = 0; i < arrayOfBatch.length; i++) {
    const condition = conditions[i]
    const batch = arrayOfBatch[i]
    if (batch.length > 0) {
      promises.push(massInsert(condition.tableName, batch))
    }
  }

  await Promise.all(promises)
}

ipcMain.on(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, async (event, filePath, listOfCustomerTable: CustomerTable[]) => {
  arrayOfCumulativePoints = new Array(listOfCustomerTable.length).fill(0)
  await initAllCustomerTable(listOfCustomerTable)

  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity,
  })

  let inserted = 0
  const batchSize = 3000
  let batch = []
  const insertPromises = []
  let cumulativePoints = BigInt(0)

  let index = 0

  try {
    await dbRun('BEGIN TRANSACTION'); // Start transaction

    for await (const line of rl) {
      index++
      const [cif, account, name, branch, region, points, balance] = line.split("|");
      cumulativePoints += BigInt(points)
      batch.push([index, cif, account, name, branch, region, parseInt(points), cumulativePoints, parseInt(balance)]);

      if (batch.length >= batchSize) {
        insertPromises.push(insertBatch(batch, listOfCustomerTable));
        inserted += batch.length;
        event.sender.send(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, inserted);
        batch = [];
      }
    }

    // Insert any remaining records in the last batch
    if (batch.length > 0) {
      insertPromises.push(insertBatch(batch, listOfCustomerTable));
      inserted += batch.length;
      event.sender.send(IpcChannels.UPLOAD_CUSTOMER_DATA_TO_DATABASE, inserted);
    }

    await Promise.all(insertPromises);

    await dbRun('COMMIT'); // Commit transaction

    console.log("File processing complete");
    event.sender.send(IpcChannels.UPLOAD_COMPLETE, true);
    event.sender.send(IpcChannels.IS_CUSTOMER_DATA_EXIST, true);

    const points = await getTotalCumulativePoints()
    windows.view.webContents.send(IpcChannels.GET_TOTAL_CUMULATIVE_POINTS, points);

  } catch (error) {
    await dbRun('ROLLBACK'); // Rollback transaction on error
    console.error("Error processing file:", error);
    dialog.showErrorBox("Error", `Error processing file: ${error.message}`);
  }

})

ipcMain.on(IpcChannels.DELETE_CUSTOMER_IN_DATABASE, async (event) => {
  try {
    await dbRun('BEGIN TRANSACTION');
    
    /* re-create table customer */
    await dropCustomerTable();
    const promises = [createCustomerTable()]
    const tempTableNameList = await getTempTableName()

    /* drop table all temporary table */
    for (const tableName of tempTableNameList) {
      promises.push(dropTable(tableName.table_name))
    }

    /* drop table temp_table_name */
    promises.push(dropTempTableName())
    promises.push(createTempTableNameTable())
    await Promise.all(promises)

    await dbRun('COMMIT');
    event.sender.send(IpcChannels.IS_CUSTOMER_DATA_EXIST, false);
  } catch (err) {
    await dbRun('ROLLBACK');
    dialog.showErrorBox("Error", `Delete Customer Data: ${err.message}`);
  }
});

ipcMain.on(IpcChannels.IS_CUSTOMER_DATA_EXIST, async (event) => {
  try {
    const isExist = await isCustomerDataExist()
    event.sender.send(IpcChannels.IS_CUSTOMER_DATA_EXIST, isExist)
  } catch (error) {
    dialog.showErrorBox("Error", `Error checking if data exists: ${error.message}`);
  }
});

ipcMain.on(IpcChannels.GET_TOTAL_CUMULATIVE_POINTS, async (event) => {
  try {
    const customerDataExists = await isCustomerDataExist()
    if (customerDataExists) {
      const points = await getTotalCumulativePoints()
      event.sender.send(IpcChannels.GET_TOTAL_CUMULATIVE_POINTS, points)
    }
  }
  catch (error) {
    dialog.showErrorBox("Error", `Get total cumulative points: ${error.message}`);
  }
})

ipcMain.on(IpcChannels.GET_CUMULATIVE_POINTS_AND_TOTAL_CUSTOMER, async (event) => {
  const result = {}

  const listOfCustomerTableObject = await getTempTableName()
  const listOfCustomerTable: string[] = listOfCustomerTableObject.map((table: any) => table.table_name)
  listOfCustomerTable.push("customer")

  for (const tableName of listOfCustomerTable) {
    const cumulativePoints = await getMaxCumulativePoints(tableName)
    const totalCustomer = await getTotalCustomer(tableName)
    result[tableName] = {
      cumulativePoints,
      totalCustomer
    }
  }

  event.sender.send(IpcChannels.GET_CUMULATIVE_POINTS_AND_TOTAL_CUSTOMER, result)
})