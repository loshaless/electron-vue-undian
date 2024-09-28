import { dbRun } from "./init";

export async function createPrizeRegionTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS prize_region (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prize_id INTEGER,
    region_id INTEGER,
    num_of_item INTEGER,
    FOREIGN KEY (prize_id) REFERENCES prize(id),
    FOREIGN KEY (region_id) REFERENCES region(region_id)
  )`);
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