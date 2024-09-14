import { dbRun, dbAll } from "../database/init";

export async function addPrize(name: string, detail: string) {
  const sql = `INSERT INTO prize (name, detail) VALUES (?, ?)`;
  await dbRun(sql, [name, detail]);
}

export async function getPrizes() {
  const sql = `SELECT * FROM prize`;
  return await dbAll(sql);
}

export async function deletePrize(id: number) {
  const sql = `DELETE FROM prize WHERE id = ?`;
  await dbRun(sql, [id]);
}

export async function editPrize(id: number, name: string, detail: string) {
  const sql = `UPDATE prize SET name = ?, detail = ? WHERE id = ?`;
  await dbRun(sql, [name, detail, id]);
}