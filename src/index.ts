import { Server, Socket } from "socket.io";
import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ServerToClientEvents, ClientToServerEvents } from "./types";
import db from "./db";

const app = express();
const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.get("/health", (_, res) => res.send("ok"));

io.on("connection", (socket) => {
  socket.on("startsession", ({ id }) => {
    if (!id)
      return socket.emit("ERROR", { type: "ERROR", message: "Missing id!" });

    db.createSession(id);

    socket.join(id);

    console.info("Successfully started session with id", id);
  });

  socket.on("savewords", async ({ id, words }) => {
    if (!id || !words) {
      console.log(
        "Missing id or words when attempting to add words",
        JSON.stringify({ id, words }),
      );
      socket.emit("ERROR", { type: "ERROR", message: "Missing id or words!" });
      return;
    }

    let res;
    try {
      res = db.addWords({ id, words });

      console.info("saved words to id", id);
    } catch (e) {
      console.error("Failed to save words to db for id", id, e.message);
      socket.emit("ERROR", { type: "ERROR", message: "Failed to save words" });
      return;
    }

    io.to(id).emit("WORDS_ADDED", {
      type: "WORDS_ADDED",
      numberOfEntries: res.numberOfEntries,
      newWordsCount: words.length,
      connectionCount: (await io.in(id).fetchSockets()).length,
    });

    console.info(
      "Successfully sent numberOfEntries to connections",
      res.numberOfEntries,
    );
  });

  socket.on("rejoinsession", async ({ id }) => {
    if (!id) {
      console.log("Attempt to rejoin session without id");
      socket.emit("ERROR", { type: "ERROR", message: "Missing id!" });
      return;
    }

    const session = db.getSession(id);

    if (!session) {
      console.log("Attempt to join non-existing session");
      socket.emit("ERROR", { type: "ERROR", message: "Invalid session" });
      return;
    }

    socket.join(id);

    socket.emit("SESSION_REJOINED", {
      type: "SESSION_REJOINED",
      sessionId: id,
      message: "Successfully rejoined session.",
      numberOfEntries: session.numberOfEntries,
      connectionCount: (await io.in(id).fetchSockets()).length,
      words: session.words,
    });
  });

  socket.on("savecloud", ({ id, cloud, wordCount }) => {
    if (!id || !cloud) return;

    io.to(id).emit("CLOUD_CREATED", {
      type: "CLOUD_CREATED",
      cloud,
      wordCount,
    });

    console.info("sendt cloud to connections.");

    const res = db.addCloud({ id, cloud, wordCount });

    if (!res) {
      socket.emit("ERROR", { type: "ERROR", message: "Non existing session!" });
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
