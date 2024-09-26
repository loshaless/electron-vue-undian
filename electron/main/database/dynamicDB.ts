import { dbGet, dbRun } from "./init";

export async function createTable(tableName: string) {
  await dbRun(`CREATE TABLE IF NOT EXISTS ${tableName} (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    points INTEGER,
    cumulative_points INTEGER
  )`);
}

export async function dropTable(tableName: string) {
  await dbRun(`DROP TABLE IF EXISTS ${tableName}`);
}

export async function massInsert(tableName: string, data: any[]) {
  const placeholders = data.map(() => '(?, ?, ?)').join(', ');
  const values = data.flatMap(item => [item[0], item[1], item[2]]);
  await dbRun(`INSERT INTO ${tableName} (customer_id, points, cumulative_points) VALUES ${placeholders}`, values);
}

export async function getMaxCumulativePoints(tableName: string) {
  const result = await dbGet(`SELECT cumulative_points FROM ${tableName} ORDER BY id DESC LIMIT 1`);
  return result.cumulative_points;
}

export async function findCustomerByCumulativePoints(tableName: string, cumulativePoints: number) {
  const result = await dbGet(`SELECT customer_id, points, cumulative_points FROM ${tableName} WHERE cumulative_points >= ?`, [cumulativePoints]);
  return result;
}

