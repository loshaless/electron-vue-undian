import { dbRun } from "./init";

export async function createPrizeRegionTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS prize_region (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prize_id INTEGER,
    region_id INTEGER,
    num_of_item INTEGER,
    FOREIGN KEY (prize_id) REFERENCES prize(id) on delete cascade,
    FOREIGN KEY (region_id) REFERENCES region(id) on delete cascade
  )`);
}

export async function isPrizeRegionDataExist() {
  const sql = `SELECT id FROM prize_region limit 1`;
  const rows = await dbRun(sql);
  return rows != undefined;
}

export async function initPrizeRegionData() {
  const sql = `
    INSERT INTO prize_region (id, prize_id, region_id, num_of_item)
    VALUES 
    (1, 1, 2, 2),
    (2, 1, 5, 1),
    (3, 1, 4, 1),
    (4, 1, 6, 1),
    (5, 1, 3, 2),
    (6, 1, 7, 1),
    (7, 2, 2, 2),
    (8, 2, 7, 1),
    (9, 2, 4, 1),
    (10, 2, 3, 2),
    (11, 2, 5, 1),
    (12, 2, 6, 1),
    (13, 3, 1, 69),
    (14, 4, 1, 6969);
  `
  await dbRun(sql);
}

export async function addPrizeRegion(prize_id: number, region_id: number, num_of_item: number) {
  const sql = `INSERT INTO prize_region (prize_id, region_id, num_of_item) VALUES (?, ?, ?)`;
  await dbRun(sql, [prize_id, region_id, num_of_item]);
}

export async function editPrizeRegion(id: number, prize_id: number, region_id: number, num_of_item: number) {
  // edit prize_id, region_id, num_of_item
  const sql = `UPDATE prize_region SET prize_id = ?, region_id = ?, num_of_item = ? WHERE id = ?`;
  await dbRun(sql, [prize_id, region_id, num_of_item, id]);
}

export async function deletePrizeRegion(id: number) {
  const sql = `DELETE FROM prize_region WHERE id = ?`;
  await dbRun(sql, [id]);
}

export async function editPrizeRegionNumOfItemByPrizeIdAndRegionId(prize_id: number, region_id: number) {
  const sql = `UPDATE prize_region SET num_of_item = num_of_item - 1 WHERE prize_id = ? AND region_id = ?`;
  await dbRun(sql, [prize_id, region_id]);
}
