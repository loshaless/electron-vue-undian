import { dbRun } from "./init";

export async function createTable(tableName: string) {
  await dbRun(`CREATE TABLE IF NOT EXISTS ${tableName} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    points INTEGER,
    cumulative_points INTEGER
  )`);
}

export async function dropTable(tableName: string) {
    await dbRun(`DROP TABLE ${tableName}`);
}

export async function massInsert(tableName: string, data: any[]) {
  const placeholders = data.map(() => '(?, ?, ?)').join(', ');
  const values = data.flatMap(item => [item[0], item[1], item[2]]);
  await dbRun(`INSERT INTO ${tableName} (customer_id, points, cumulative_points) VALUES ${placeholders}`, values);
}