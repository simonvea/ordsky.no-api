import assert from "assert";
import type { DbSession } from "../db/types.ts";
import db from "../db/database.ts";

const sql = db.createTagStore();

export const getSession = (id: string): DbSession | undefined => {
  return sql.get`SELECT * FROM sessions WHERE session_id = ${id}` as
    | DbSession
    | undefined;
};

export const createSession = (id: string, words: string[]): DbSession => {
  assert(id);
  assert(words);

  const wordsToAdd = JSON.stringify(words);

  const session =
    sql.get`INSERT INTO sessions (session_id, words, entries_count) VALUES (${id}, ${wordsToAdd}, ${1}) RETURNING *` as DbSession;

  return session!;
};

export const addWords = (id: string, words: string[]) => {
  assert(id);
  assert(words);

  const session = getSession(id);

  if (!session) throw new Error("Failed to find session to update!");

  const existingWords = JSON.parse(session.words);
  const newList = [...existingWords, ...words];
  const json = JSON.stringify(newList);

  const newSession =
    sql.get`UPDATE sessions SET words = ${json}, entries_count = entries_count + 1, updated_at = date('now') WHERE session_id = ${id} RETURNING *` as DbSession;

  return newSession!;
};

export const addCloud = (id: string, cloud: any[]) => {
  assert(id);
  assert(cloud);
  const json = JSON.stringify(cloud);

  const session =
    sql.get`UPDATE sessions SET cloud = ${json}, updated_at = date('now') WHERE session_id = ${id} RETURNING *` as DbSession;

  return session;
};

export const addCloudAndWordCount = (
  id: string,
  cloud: any[],
  wordCount: any[],
): DbSession => {
  assert(cloud);
  assert(wordCount);

  const cloudJson = JSON.stringify(cloud);
  const wordCountJson = JSON.stringify(wordCount);

  const session =
    sql.get`UPDATE sessions set cloud = ${cloudJson}, word_count = ${wordCountJson}, updated_at = date('now') WHERE session_id = ${id} RETURNING *` as DbSession;

  return session;
};
