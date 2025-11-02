import assert from "node:assert";
import type { DbSession, SessionResponse } from "../db/types.ts";
import db from "../db/database.ts";
import { dbSessionToSessionResponse } from "../db/utils.ts";

const sql = db.createTagStore();

export interface Db {
  createSession: (id: string) => void;
  addWords: ({}: { id: string; words: string[] }) => SessionResponse;
  getSession: (id: string) => SessionResponse | undefined;
  addCloud: ({}: {
    id: string;
    cloud: any;
    wordCount: number;
  }) => SessionResponse | undefined;
  removeStaleSessions: () => number;
}

export default {
  createSession: (id) => {
    sql.run`INSERT INTO live_sessions (session_id, entries_count, words) VALUES (${id}, ${0}, ${"[]"})`;
  },
  addWords: ({ id, words }) => {
    assert(id);
    assert(words);
    const session =
      sql.get`SELECT * FROM live_sessions WHERE session_id = ${id}` as DbSession;

    if (!session) {
      console.error(
        "Attempt to add words to non-existing session with id " + id,
      );
      throw new Error("Session does not exist");
    }

    const existingWords = JSON.parse(session.words);
    const newList = [...existingWords, ...words];
    const json = JSON.stringify(newList);

    const newSession =
      sql.get`UPDATE live_sessions SET words = ${json}, entries_count = entries_count + 1, updated_at = date('now') WHERE session_id = ${id} RETURNING *` as DbSession;

    return dbSessionToSessionResponse(newSession);
  },
  getSession: (id) => {
    const rawData =
      sql.get`SELECT * FROM live_sessions WHERE session_id = ${id}` as DbSession;

    if (!rawData) return;

    return dbSessionToSessionResponse(rawData);
  },
  addCloud: ({ id, cloud, wordCount }) => {
    assert(id);
    assert(cloud);
    assert(wordCount);

    const session =
      sql.get`SELECT * FROM live_sessions WHERE session_id = ${id}` as DbSession;

    if (!session) {
      console.error(
        "Attempt to add words to non-existing session with id " + id,
      );
      throw new Error("Session does not exist");
    }

    const cloudJson = JSON.stringify(cloud);
    const wordCountJson = JSON.stringify(wordCount);

    const newSession =
      sql.get`UPDATE live_sessions SET cloud = ${cloudJson}, word_count = ${wordCountJson}, updated_at = date('now') WHERE session_id = ${id} RETURNING *` as DbSession;

    return dbSessionToSessionResponse(newSession);
  },
  removeStaleSessions: () => {
    const result = sql.run`
      DELETE FROM live_sessions
      WHERE cloud IS NULL
      AND updated_at < datetime('now', '-1 day')
    `;
    return Number(result.changes);
  },
} satisfies Db;
