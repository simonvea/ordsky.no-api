import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import registerCollabFeatureHandlers from "./collabFeature/socket.ts";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./collabFeature/types.ts";
import app from "./app.ts";
import { runMigrations } from "./collectFeature/db/migrate.ts";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: { origin: ALLOWED_ORIGIN },
});

const onConnection = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  registerCollabFeatureHandlers(io, socket);
};

io.on("connection", onConnection);

try {
  runMigrations();
} catch (error) {
  console.error("Failed to run migrations:", error);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("server running at http://localhost:3000");
});
