import { dbRun, dbGet, dbAll } from "../database/init";

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

export async function getCustomerDataByBalanceAndRegion(
  minBalance: number, 
  region: string
) {
  const sql = `
    SELECT id, points
    FROM customer
    WHERE balance >= ? AND region = ? AND roll_id IS NULL
  `;
  return await dbAll(sql, [minBalance, region]);
}

export async function findCustomerById(id: number) {
  const sql = `SELECT * FROM customer WHERE id = ?`;
  return await dbGet(sql, [id]);
}

export async function updateCustomerRollId(id: number, rollId: number) {
  const sql = `UPDATE customer SET roll_id = ? WHERE id = ?`;
  await dbRun(sql, [rollId, id]);
}
