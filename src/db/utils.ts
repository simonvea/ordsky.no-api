import type { DbSession, SessionResponse } from "./types.ts";

export const dbSessionToSessionResponse = (
  dbSession: DbSession,
): SessionResponse => ({
  id: dbSession.session_id,
  words: JSON.parse(dbSession.words),
  cloud: dbSession.cloud ? JSON.parse(dbSession.cloud) : undefined,
  wordCount: dbSession.word_count
    ? JSON.parse(dbSession.word_count)
    : undefined,
  numberOfEntries: dbSession.entries_count,
  createdAt: dbSession.created_at,
  updatedAt: dbSession.updated_at,
});
