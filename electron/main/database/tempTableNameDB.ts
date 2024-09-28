import { dbAll, dbRun } from "./init";

export async function createTempTableNameTable() {
  await dbRun(`CREATE TABLE IF NOT EXISTS temp_table_name (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name VARCHAR(255)
  )`);
}

export async function addTempTableName(tableName: string) {
  await dbRun(`INSERT INTO temp_table_name (table_name) VALUES (?)`, [tableName]);
}

export async function getTempTableName() {
  const result = await dbAll(`SELECT table_name FROM temp_table_name`);
  return result;
}

export async function dropTempTableName() {
  await dbRun(`DROP TABLE IF EXISTS temp_table_name`);
}