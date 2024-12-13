import sqlite3 from "sqlite3";
import { promisify } from 'util';
const DBSOURCE = "db.sqlite";
import { createCustomerTable } from "./customerDB";
import { createCategoryTable } from "./categoryDB";
import { createWinnerTable } from "./winnerDB";
import {createPrizeTable, initPrizeData, isPrizeDataExist} from "./prizeDB";
import { createRegionTable } from "./regionDB";
import {createPrizeRegionTable, initPrizeRegionData, isPrizeRegionDataExist} from "./prize_regionDB";
import { createTempTableNameTable } from "./tempTableNameDB";
import { createBackgroundImageTable } from "./backgroundImageDB";

export const db = new sqlite3.Database(DBSOURCE, async (err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  await dbRun(`PRAGMA foreign_keys = ON;`)

  const promises = [
    createCustomerTable(),
    createPrizeTable(),
    createCategoryTable(),
    createWinnerTable(),
    createRegionTable(),
    createPrizeRegionTable(),
    createTempTableNameTable(),
    createBackgroundImageTable(),
  ]
  await Promise.all(promises)

  const isPrizeExist = await isPrizeDataExist()
  if(!isPrizeExist) {
    await initPrizeData()
  }

  const isPrizeRegionExist = await isPrizeRegionDataExist()
  if (!isPrizeRegionExist) {
    await initPrizeRegionData()
  }
});

export const dbAll = promisify(db.all).bind(db);
export const dbGet = promisify(db.get).bind(db);
export const dbRun = promisify(db.run).bind(db);
