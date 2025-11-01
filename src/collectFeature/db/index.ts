import type { DbSession } from "../types.ts";
import db from "./database.ts";

const sql = db.createTagStore();

export const getSession = (id: string): DbSession | undefined => {
  return sql.get`SELECT * FROM sessions WHERE id = ${id}` as
    | DbSession
    | undefined;
};
