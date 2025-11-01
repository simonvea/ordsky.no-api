import { Router } from "express";
import db from "./db.ts";

export const collabRouter = Router();

export const BASE_PATH = "/collaborative";

collabRouter.get("/:id", ({ params }, res) => {
  const session = db.getSession(params.id);

  if (!session) return res.status(404).send("Not found.");

  res.send(session);
});

collabRouter.get("/:id/words", ({ params }, res) => {
  const session = db.getSession(params.id);

  if (!session) return res.status(404).send("Not found.");

  res.send({ id: session.id, words: session.words });
});
