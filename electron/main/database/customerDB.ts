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
    ${region === 'All Region' ? "" : "AND region = ?"}
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

export async function getTotalCustomer() {
  const sql = `SELECT customer_id FROM customer order by customer_id desc limit 1`;
  const result = await dbGet(sql);
  return result.customer_id;
}

export async function massInsertCustomer(data: any[]) {
  const placeholders = data.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const values = data.flatMap(item => [item[0], item[1], item[2], item[3], item[4], item[5], item[6], item[7].toString(), item[8]]);
  await dbRun(`INSERT INTO customer (customer_id, cif, account, name, branch, region, points, cumulative_points, balance) VALUES ${placeholders}`, values);
}

export async function deleteAllRollId() {
  await dbRun(`UPDATE customer SET roll_id = NULL`);
}