import type { Server, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SessionData,
} from "./types.ts";
import db from "./db.ts";

export default (
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  const startSession = ({ id }: { id: string }) => {
    if (!id)
      return socket.emit("ERROR", { type: "ERROR", message: "Missing id!" });

    db.createSession(id);

    socket.join(id);

    console.info("Successfully started session with id", id);
    return;
  };

  socket.on("startsession", startSession);

  socket.on("savewords", async ({ id, words }) => {
    if (!id || !words) {
      console.log(
        "Missing id or words when attempting to add words",
        JSON.stringify({ id, words }),
      );
      socket.emit("ERROR", { type: "ERROR", message: "Missing id or words!" });
      return;
    }

    let res: SessionData;
    try {
      res = db.addWords({ id, words });

      console.info("saved words to id", id);
    } catch (e) {
      console.error(
        "Failed to save words to db for id",
        id,
        (e as Error).message,
      );
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

  socket.on("joinsession", async ({ id }) => {
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

    socket.emit("SESSION_JOINED", {
      type: "SESSION_JOINED",
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
};
