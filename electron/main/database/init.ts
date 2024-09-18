import sqlite3 from "sqlite3";
import { promisify } from 'util';
const DBSOURCE = "db.sqlite";

export const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log("init database");

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customer (
      customer_id INTEGER PRIMARY KEY AUTOINCREMENT,
      cif TEXT,
      account TEXT,
      name TEXT,
      branch TEXT,
      region TEXT,
      points INTEGER,
      cumulative_points INTEGER,
      balance INTEGER,
      roll_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS prize (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      detail TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS roll (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      points INTEGER,
      cumulative_points INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS winner (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prize_name TEXT,
      roll_id INTEGER,
      customer_name TEXT,
      region TEXT,
      created_at TIMESTAMP DEFAULT (DATETIME('now', 'localtime'))
    )`);
  });
});

export const dbAll = promisify(db.all).bind(db);
export const dbGet = promisify(db.get).bind(db);
export const dbRun = promisify(db.run).bind(db);