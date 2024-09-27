import sqlite3 from "sqlite3";
import { promisify } from 'util';
const DBSOURCE = "db.sqlite";
import { createCustomerTable } from "./customerDB";
import { createCategoryTable } from "./categoryDB";
import { createWinnerTable } from "./winnerDB";
import { createPrizeTable } from "./prizeDB";
import { createRegionTable, initRegion, isRegionExist, isRegionExist } from "./regionDB";

export const db = new sqlite3.Database(DBSOURCE, async (err) => {
  if (err) {
    console.error(err.message);
    return;
  }

  const promises = [
    createCustomerTable(),
    createPrizeTable(),
    createCategoryTable(),
    createWinnerTable(),
    createRegionTable()
  ]
  await Promise.all(promises)

  const isRegionDataExist = await isRegionExist()
  if (!isRegionDataExist) {
    await initRegion()
  }
});

export const dbAll = promisify(db.all).bind(db);
export const dbGet = promisify(db.get).bind(db);
export const dbRun = promisify(db.run).bind(db);