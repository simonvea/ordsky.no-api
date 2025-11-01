import { Router } from "express";
import {
  addCloudAndWordCount,
  addWords,
  createSession,
  getSession,
} from "./db/index.ts";
import { dbSessionToSessionResponse } from "./utils.ts";
import type { DbSession } from "./types.ts";

export const collectRouter = Router();

export const COLLECT_BASE_URL = "/felles";

collectRouter.get("/:id", ({ params }, res) => {
  const session = getSession(params.id);

  if (!session) return res.status(404).send("Session not found.");

  const response = dbSessionToSessionResponse(session);

  res.send(response);
});

collectRouter.put("/:id/words", ({ params, body }, res) => {
  const id = params.id;
  if (!id || id.length !== 5) return res.status(404).send("Unknown session");

  if (!body || !Array.isArray(body)) {
    return res.status(400).send("Missing words");
  }
  const existing = getSession(id);
  let session: DbSession;

  if (!!existing) {
    session = addWords(id, body);
  } else {
    session = createSession(id, body);
  }

  const response = dbSessionToSessionResponse(session);

  res.send(response);
});

collectRouter.put("/:id/cloud", ({ params, body }, res) => {
  const id = params.id;
  if (!id || id.length !== 5) return res.status(404).send("Unknown session");

  if (!body || !Array.isArray(body)) {
    return res.status(400).send("Missing cloud");
  }

  const session = getSession(id);

  if (!session) return res.status(404).send("Session not found.");

  const result = dbSessionToSessionResponse(session);

  res.send(result);
});

export type WordCount = Array<{
  text: string;
  count: number;
}>;

collectRouter.patch("/:id", ({ params, body }, res) => {
  const id = params.id;

  if (!id || id.length !== 5) return res.status(404).send("Unknown session");

  const { cloud, wordCount } = body;

  if (!cloud || !wordCount)
    return res.status(400).send("Need both cloud and wordCount");

  const session = getSession(id);

  if (!session) return res.status(404).send("Session not found.");

  const newSession = addCloudAndWordCount(id, cloud, wordCount);

  const response = dbSessionToSessionResponse(newSession);

  res.send(response);
});
