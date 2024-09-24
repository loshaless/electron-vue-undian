import sqlite3 from "sqlite3";
import { promisify } from 'util';
const DBSOURCE = "db.sqlite";
import { createCustomerTable } from "./customerDB";
import { createCategoryTable } from "./categoryDB";

export const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log("init database");

  db.serialize(() => {
    createCustomerTable()

    db.run(`CREATE TABLE IF NOT EXISTS prize (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255),
      detail TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS roll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      points INTEGER,
      cumulative_points INTEGER
    )`);

    createCategoryTable()

    db.run(`CREATE TABLE IF NOT EXISTS winner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prize_name VARCHAR(255),
      roll_id INTEGER,
      customer_name VARCHAR(100),
      region VARCHAR(100),
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime'))
    )`);
  });
});

export const dbAll = promisify(db.all).bind(db);
export const dbGet = promisify(db.get).bind(db);
export const dbRun = promisify(db.run).bind(db);