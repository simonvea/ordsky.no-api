import express, { Router } from "express";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import { BASE_PATH, collabRouter } from "./collabFeature/api.ts";
import { COLLECT_BASE_URL, collectRouter } from "./collectFeature/api.ts";

const app = express();

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";
const CORS_POLICY = (process.env.CORS_POLICY || "same-site") as
  | "same-site"
  | "same-origin"
  | "cross-origin";

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}
if (process.env.NODE_ENV === "production") {
  app.use(helmet({ crossOriginResourcePolicy: { policy: CORS_POLICY } }));
}

const corsHandler = cors({ origin: ALLOWED_ORIGIN });

app.use(corsHandler);

// routes
const baseRouter = Router();

app.options("/{*splat}", corsHandler);
baseRouter.use(BASE_PATH, collabRouter);
baseRouter.use(COLLECT_BASE_URL, collectRouter);
app.use("/api", baseRouter);

app.get("/api/health", (_, res) => res.send("ok"));

export default app;
