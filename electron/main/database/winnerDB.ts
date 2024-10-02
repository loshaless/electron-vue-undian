import { dbRun, dbAll, dbGet } from "./init";

export async function createWinnerTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS winner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prize_name VARCHAR(255),
    roll_id INTEGER,
    customer_name VARCHAR(100),
    customer_id INTEGER,
    region VARCHAR(100),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime'))
  )`);
}
export async function addWinner(prizeName: string, rollId: number, customerId: number, customerName: string, region: string, category: number) {
  const sql = `INSERT INTO winner (prize_name, roll_id, customer_id, customer_name, region, category) VALUES (?, ?, ?, ?, ?, ?)`;
  return await dbRun(sql, [prizeName, rollId, customerId, customerName, region, category]);
}

export async function getWinnerByCategory(categoryId: number[]) {
  const placeholders = categoryId.map(() => '?').join(',');
  const sql = `SELECT * FROM winner WHERE category IN (${placeholders})`;
  return await dbAll(sql, categoryId);
}

export interface WinnerDetail {
  cif: string;
  account: string;
  name: string;
  branch: string;
  region: string;
  points: number;
  balance: number;
  roll_id: number;
  prize_name: string;
}

export async function getWinnerDetailByCategory(categoryId: number[]): Promise<WinnerDetail[]> {
  const placeholders = categoryId.map(() => '?').join(',');
  const sql = `
    SELECT c.cif, c.account, c.name, c.branch, c.region, c.points, c.balance, c.roll_id, w.prize_name
    FROM winner w
    JOIN customer c ON w.customer_id = c.customer_id
    WHERE w.category IN (${placeholders})
    ORDER BY w.prize_name ASC
  `;
  return await dbAll(sql, categoryId);
}

export async function isWinnerDataExist() {
  const sql = `SELECT id FROM winner limit 1`;
  const data = await dbGet(sql);
  return !!data;
}

export async function deleteWinnerData() {
  const sql = `DELETE FROM winner`;
  return await dbRun(sql);
}