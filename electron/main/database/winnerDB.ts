import { dbRun, dbAll, dbGet } from "./init";

export async function createWinnerTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS winner (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prize_name VARCHAR(255),
    roll_id INTEGER,
    customer_name VARCHAR(100),
    region VARCHAR(100),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime'))
  )`);
}
export async function addWinner(prizeName: string, rollId: number, customerName: string, region: string, category: number) {
  const sql = `INSERT INTO winner (prize_name, roll_id, customer_name, region, category) VALUES (?, ?, ?, ?, ?)`;
  return await dbRun(sql, [prizeName, rollId, customerName, region, category]);
}

export async function getWinnerByCategory(categoryId: number[]) {
  const placeholders = categoryId.map(() => '?').join(',');
  const sql = `SELECT * FROM winner WHERE category IN (${placeholders})`;
  return await dbAll(sql, categoryId);
}