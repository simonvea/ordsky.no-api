import { DatabaseSync } from "node:sqlite";

let dbUrl = process.env.DB_URL;

if (!dbUrl) {
  console.warn("Missing db url, starting in memory db.");
  dbUrl = ":memory:";
}

const db = new DatabaseSync(dbUrl);

export default db;
