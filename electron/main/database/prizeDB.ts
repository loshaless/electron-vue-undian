import { dbRun, dbAll, dbGet } from "../database/init";

export async function createPrizeTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS prize (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    UNIQUE (name)
  )`);
}

export async function addPrize(name: string) {
  const sql = `INSERT INTO prize (name) VALUES (?)`;
  await dbRun(sql, [name]);
}

export async function getPrizeId(name: string) {
  const sql = `SELECT id FROM prize WHERE name = ?`;
  const rows = await dbGet(sql, [name]);
  return rows?.id;
}

export async function getAllPrizes() {
  const sql = `SELECT * FROM prize`;
  return await dbAll(sql);
}

export interface AllPrizeJoinRegion{
  id: number,
  prize_name: string,
  region_id: number,
  region_name: string,
  num_of_item: number,
  prize_region_id: number
}

export async function getAllPrizeJoinRegion(): Promise<AllPrizeJoinRegion[]>  {
  const sql = `
    SELECT prize.id, 
    prize.name as prize_name, 
    region.id as region_id,
    region.name as region_name,
    prize_region.id as prize_region_id,
    prize_region.num_of_item as num_of_item
    FROM prize 
    JOIN prize_region ON prize.id = prize_region.prize_id 
    JOIN region ON region.id = prize_region.region_id`
  ;
  return await dbAll(sql);
}

export async function isPrizeDataExist() {
  const sql = `SELECT id FROM prize limit 1`;
  const rows = await dbGet(sql);
  return rows != undefined;
}

export async function deletePrize(id: number) {
  const sql = `DELETE FROM prize WHERE id = ?`;
  await dbRun(sql, [id]);
}

export async function editPrize(id: number, name: string) {
  const sql = `UPDATE prize SET name = ? WHERE id = ?`;
  await dbRun(sql, [name, id]);
}