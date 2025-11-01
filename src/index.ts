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

io.on("connection", (socket) => {
  socket.on("startsession", ({ id }) => {
    if (!id)
      return socket.emit("ERROR", { type: "ERROR", message: "Missing id!" });

    db.createSession(id);

    socket.join(id);

    console.info("Successfully started session with id", id);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
