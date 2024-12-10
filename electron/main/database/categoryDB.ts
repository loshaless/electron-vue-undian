import { dbRun, dbAll, dbGet } from "./init";

const categories = [
  "Grand Prize",
  "Premium Prize",
  "Lucky Prize"
]

export async function isCategoryDataExist() {
  const sql = `SELECT id from category limit 1`;
  const rows = await dbGet(sql);
  return !!rows;
}

export async function createCategoryTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS category (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name VARCHAR(255),
		min_balance INTEGER
	)`);

  const isCategoryExist = await isCategoryDataExist();
  if (isCategoryExist) return;

  // insert all
  categories.map(async (category, index) => {
    await dbRun(`INSERT INTO category (id, name, min_balance) VALUES (?, ?, ?)`, [index + 1, category, 0]);
  });
}

// insert multiple category
export async function massInsertCategory(categories: any[]) {
  const placeholders = categories.map(() => '(?, ?, ?)').join(', ');
  const values = categories.flatMap(category => [category.name, category.minBalance, JSON.stringify(category.prize)]);
  await dbRun(`INSERT INTO category (name, min_balance, prize) VALUES ${placeholders}`, values);
}

export async function getCategoryJoinPrize() {
  const sql = `
    SELECT 
    c.id, 
    c.name, 
    c.min_balance, 
    prize.id as prize_id
    FROM category c
    LEFT JOIN prize ON prize.category_id = c.id
    ORDER BY c.id asc 
	`;

  const rows = await dbAll(sql);
  return rows;
}

export async function editCategory(id: number, minBalance: number) {
  const sql = `UPDATE category SET min_balance = ? WHERE id = ?`;
  await dbRun(sql, [minBalance, id]);
}

export async function makeAllCategoryPrizeNull() {
  const sql = `UPDATE prize SET category_id = NULL`;
  await dbRun(sql);
}

export async function getCategory() {
  const sql = `SELECT * FROM category`;
  const rows = await dbAll(sql);
  return rows;
}
