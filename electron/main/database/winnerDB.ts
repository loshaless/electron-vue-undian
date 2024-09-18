import { dbRun } from "./init";

export async function addWinner(prizeName: string, rollId: number, customerName: string, region: string, category: number) {
  const sql = `INSERT INTO winner (prize_name, roll_id, customer_name, region, category) VALUES (?, ?, ?, ?, ?)`;
  return await dbRun(sql, [prizeName, rollId, customerName, region, category]);
}