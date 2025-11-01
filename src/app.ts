import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import { BASE_PATH, collabRouter } from "./collabFeature/api.ts";

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}
if (process.env.NODE_ENV === "production") {
  app.use(helmet());
}

// routes
app.use(BASE_PATH, collabRouter);

app.get("/health", (_, res) => res.send("ok"));

app.get("/felles/:id", ({ params }, res) => {});

export default app;
