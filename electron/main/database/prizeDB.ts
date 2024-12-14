import { dbRun, dbAll, dbGet } from "../database/init";

export async function createPrizeTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS prize (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER,
    image_path TEXT DEFAULT null,
    UNIQUE (name),
    FOREIGN KEY (category_id) REFERENCES category(id)
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

export interface AllPrizeJoinRegion {
  id: number,
  prize_name: string,
  prize_image_path: string | null,
  region_id: number | null,
  region_name: string | null,
  num_of_item: number | null,
  prize_region_id: number | null
}

export async function getAllPrizeJoinRegion(): Promise<AllPrizeJoinRegion[]> {
  const sql = `
    SELECT prize.id, 
    prize.name as prize_name,
    prize.image_path as prize_image_path,
    region.id as region_id,
    region.name as region_name,
    prize_region.id as prize_region_id,
    prize_region.num_of_item as num_of_item
    FROM prize 
    LEFT JOIN prize_region ON prize.id = prize_region.prize_id 
    LEFT JOIN region ON region.id = prize_region.region_id`
    ;
  return await dbAll(sql);
}

export async function isPrizeDataExist() {
  const sql = `SELECT id FROM prize limit 1`;
  const rows = await dbGet(sql);
  return rows != undefined;
}

export async function initPrizeData() {
    const sql = `
      INSERT INTO prize (id, name, category_id, image_path)
      VALUES
        (1, 'Mobil All New Kijang Innova Zenis G HEV', 1, null),
        (2, 'Sepeda Motor Honda PCX160 CBS', 2, null),
        (3, 'Emas @ 10 gram', 3, null),
        (4, 'Voucher Belanja Pluxee @ Rp 500,000', 3, null);
    `
    await dbRun(sql);
}

export async function deletePrize(id: number) {
  const sql = `DELETE FROM prize WHERE id = ?`;
  await dbRun(sql, [id]);
}

export async function editPrize(id: number, name: string) {
  const sql = `UPDATE prize SET name = ? WHERE id = ?`;
  await dbRun(sql, [name, id]);
}

export async function editCategoryPrize(id: number, categoryId: number) {
  const sql = `UPDATE prize SET category_id = ? WHERE id = ?`;
  await dbRun(sql, [categoryId, id]);
}

export async function editBackgroundImagePrize(id: number, imagePath: string) {
  const sql = `UPDATE prize SET image_path = ? WHERE id = ?`;
  await dbRun(sql, [imagePath, id]);
}

export async function getBackgroundImageByPrizeId(id: number) {
  const sql = `SELECT image_path FROM prize WHERE id = ?`;
  const rows = await dbGet(sql, [id]);
  return rows?.image_path;
}
