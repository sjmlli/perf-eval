import Database from "better-sqlite3";

export const db = new Database("./perf_eval.sqlite");

export function runSchema(sqlText) {
  db.exec(sqlText);
}
