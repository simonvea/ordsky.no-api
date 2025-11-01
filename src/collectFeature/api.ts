import { Router } from "express";
import { getSession } from "./db/index.ts";
import { dbSessionToSessionResponse } from "./utils.ts";

export const collectRouter = Router();

export const COLLECT_BASE_URL = "/felles";

collectRouter.get("/:id", ({ params }, res) => {
  const session = getSession(params.id);

  if (!session) return res.status(404).send("Session not found.");

  const response = dbSessionToSessionResponse(session);

  res.send(response);
});
