import { dbAll, dbGet, dbRun } from "./init";

export async function createRegionTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS region (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255)
  )`);
}

const regions = [
  "Jakarta A",
  "Jakarta B",
  "Jabar Jateng",
  "Jawa Timur",
  "Sumatera",
  "IBN & Kalimantan"
]
export async function initRegion() {
  await dbRun('BEGIN TRANSACTION');
  for (const region of regions) {
    await addRegion(region);
  }
  await dbRun('COMMIT');
}

export async function addRegion(name: string) {
  const sql = `INSERT INTO region (name) VALUES (?)`;
  await dbRun(sql, [name]);
}

export async function getRegions() {
  const sql = `SELECT * FROM region`;
  return await dbAll(sql);
}

export async function deleteRegion(id: number) {
  const sql = `DELETE FROM region WHERE id = ?`;
  await dbRun(sql, [id]);
}

export async function isRegionExist() {
  const sql = `SELECT id FROM region limit 1`;
  const result = await dbGet(sql);
  return result !== undefined;
}