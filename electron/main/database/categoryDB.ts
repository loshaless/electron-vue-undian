import { dbRun, dbAll } from "./init";

export async function dropCategoryTable() {
	await dbRun(`DROP TABLE category`);
}

export async function createCategoryTable() {
	await dbRun(`CREATE TABLE IF NOT EXISTS category (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name VARCHAR(255),
		min_balance INTEGER,
		prize TEXT
	)`);
}

// insert multiple category
export async function massInsertCategory(categories: any[]) {
	const placeholders = categories.map(() => '(?, ?, ?)').join(', ');
	const values = categories.flatMap(category => [category.name, category.minBalance, JSON.stringify(category.prize)]);
	await dbRun(`INSERT INTO category (name, min_balance, prize) VALUES ${placeholders}`, values);
}

export async function getCategory() {
	return await dbAll(`SELECT * FROM category`);
}
