import type { SessionData } from "./types.ts";

const db: Map<string, SessionData> = new Map();

export interface Db {
  createSession: (id: string) => void;
  addWords: ({}: { id: string; words: string[] }) => SessionData;
  getSession: (id: string) => SessionData | undefined;
  addCloud: ({}: {
    id: string;
    cloud: any;
    wordCount: number;
  }) => SessionData | undefined;
}

export default {
  createSession: (id) =>
    db.set(id, { id, numberOfEntries: 0, words: [], createdAt: new Date() }),
  addWords: ({ id, words }) => {
    let current = db.get(id);

    if (!current) {
      console.error(
        "Attempt to add words to non-existing session with id " + id,
      );
      throw new Error("Session does not exist");
    }

    const updated = {
      ...current,
      numberOfEntries: (current.numberOfEntries += 1),
      words: [...current.words, ...words],
      wordCount: current.words.length + words.length,
    };
    db.set(id, updated);
    return updated;
  },
  getSession: (id) => {
    return db.get(id);
  },
  addCloud: ({ id, cloud, wordCount }) => {
    const currentSession = db.get(id);

    if (!currentSession) return;

    const updated: SessionData = {
      ...currentSession,
      cloud,
      wordCount,
    };

    db.set(id, updated);

    return updated;
  },
} satisfies Db;
