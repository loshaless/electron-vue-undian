import { dbRun, dbGet } from "../database/init";

export async function deleteCustomerData() {
  await dbRun(`DELETE FROM customer`);
}

export async function resetCustomerSequence() {
  await dbRun(`DELETE FROM sqlite_sequence WHERE name='customer'`);
}

export async function isCustomerDataExist() {
  const row = await dbGet("SELECT name FROM customer limit 1");
  return row !== undefined;
}