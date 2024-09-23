import { dbRun, dbGet, dbAll } from "../database/init";

export async function dropCustomerTable() {
  await dbRun(`DROP TABLE customer`);
}

export async function createCustomerTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS customer (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      cif VARCHAR(255),
      account VARCHAR(100),
      name VARCHAR(100),
      branch VARCHAR(100),
      region VARCHAR(100),
      points INTEGER,
      cumulative_points INTEGER,
      balance INTEGER,
      roll_id INTEGER
    )`);
}

export async function isCustomerDataExist() {
  const row = await dbGet("SELECT name FROM customer limit 1");
  return row !== undefined;
}

export async function getCustomerDataByBalanceAndRegion(
  minBalance: number, 
  region: string,
  limit: number,
  offset: number
) {
  const sql = `
    SELECT customer_id, points
    FROM customer
    WHERE balance >= ? 
    ${region === 'All Region' ? "": "AND region = ?"}
    AND roll_id IS NULL
    ORDER BY customer_id
    LIMIT ? OFFSET ?
  `;
  
  const params = region === 'All Region' ? [minBalance, limit, offset] : [minBalance, region, limit, offset];
  return await dbAll(sql, params);
}

export async function findCustomerById(id: number) {
  const sql = `SELECT * FROM customer WHERE customer_id = ?`;
  return await dbGet(sql, [id]);
}

export async function updateCustomerRollId(id: number, rollId: number) {
  const sql = `UPDATE customer SET roll_id = ? WHERE customer_id = ?`;
  await dbRun(sql, [rollId, id]);
}

export async function getTotalCumulativePoints(): Promise<number> {
  const sql = `
    SELECT cumulative_points 
    FROM customer
    ORDER BY customer_id DESC
    limit 1
  `
  const result = await dbGet(sql)
  return result.cumulative_points
}