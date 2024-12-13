import { dbAll, dbGet, dbRun } from "./init";
import { Region } from "../../../src/constants/types/Region";

export async function createRegionTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS region (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255)
  )`);

  const isRegionDataExist = await isRegionExist();
  if (!isRegionDataExist) {
    await initRegion()
  }
}

export async function initRegion() {
  const sql = `
    INSERT INTO region (id, name)
    VALUES
      (1, 'All Region'),
      (2, 'Jakarta A'),
      (3, 'Jakarta B'),
      (4, 'Jabar Jateng'),
      (5, 'Jawa Timur'),
      (6, 'Sumatera'),
      (7, 'Kalimantan');
  `;
  await dbRun(sql);
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

export async function massAddRegion(regions: Region[]) {
  for (const region of regions) {
    await addRegion(region.name);
  }
}

export async function dropRegionTable() {
  await dbRun('DROP TABLE IF EXISTS region');
}

export async function editRegion(id: number, name: string) {
  const sql = `UPDATE region SET name = ? WHERE id = ?`;
  await dbRun(sql, [name, id]);
}
