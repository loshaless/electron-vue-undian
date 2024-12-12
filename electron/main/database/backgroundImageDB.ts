import { dbGet, dbRun } from "./init";
import { PageName } from "../../../src/constants/enum/PageName";

export async function createBackgroundImageTable() {
  const isTableExist = await isBackgroundImageTableExist()
  if (!isTableExist) {
    await dbRun(`CREATE TABLE IF NOT EXISTS background_image (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      image_path TEXT DEFAULT null
    )`)

    await initNameToBackgroundImageTable()
  }
}

const listOfPageName = [PageName.HOME, PageName.WINNER]

export async function initNameToBackgroundImageTable() {
  // loop enum of PageName
  for (const pageName of listOfPageName) {
    await dbRun(`INSERT INTO background_image (name) VALUES (?)`, [pageName])
  }
}

export async function isBackgroundImageTableExist() {
  const result = await dbGet(`SELECT name FROM sqlite_master WHERE type='table' AND name='background_image'`);
  return result !== undefined;
}

export function updateBackgroundImageByName(imagePath: string, name: string) {
  return dbRun(`UPDATE background_image SET image_path = ? WHERE name = ?`, [imagePath, name])
}

export function getBackgroundImageByName(name: string) {
  return dbGet(`SELECT image_path FROM background_image WHERE name = ?`, [name])
}
