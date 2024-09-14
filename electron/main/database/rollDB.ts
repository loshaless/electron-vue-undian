import { dbRun } from "./init";

export async function deleteAllRollData(){
  try{
    await dbRun("BEGIN TRANSACTION");
    await dbRun(`DELETE FROM roll`);
    console.log("All roll data deleted successfully");

    await dbRun(`DELETE FROM sqlite_sequence WHERE name='roll'`);
    console.log("Roll sequence deleted successfully");

    await dbRun("COMMIT");
    console.log("Roll data deleted successfully");
  } catch (err) {
    await dbRun("ROLLBACK");
    console.error("Error deleting roll data:", err.message);
  }
}