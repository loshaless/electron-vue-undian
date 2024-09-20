import { dbRun, dbAll } from "./init";

export async function addWinner(prizeName: string, rollId: number, customerName: string, region: string, category: number) {
  const sql = `INSERT INTO winner (prize_name, roll_id, customer_name, region, category) VALUES (?, ?, ?, ?, ?)`;
  return await dbRun(sql, [prizeName, rollId, customerName, region, category]);
}

export async function getWinnerByCategory(categoryId: number[]) {
  const placeholders = categoryId.map(() => '?').join(',');
  const sql = `SELECT * FROM winner WHERE category IN (${placeholders})`;
  return await dbAll(sql, categoryId);
}