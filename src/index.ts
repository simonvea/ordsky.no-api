import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import registerCollabFeatureHandlers from "./collabFeature/socket.ts";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./collabFeature/types.ts";
import app from "./app.ts";
import { runMigrations } from "./db/migrate.ts";
import { startCleanupJob } from "./collabFeature/cron.ts";
import { websocketConnections } from "./metrics.ts";

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  path: "/ws",
  cors: { origin: ALLOWED_ORIGIN },
  transports: ["websocket"],
});

const onConnection = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  // Track WebSocket connection
  websocketConnections.labels('connect').inc();

  socket.on('disconnect', () => {
    websocketConnections.labels('disconnect').inc();
  });

  registerCollabFeatureHandlers(io, socket);
};

io.on("connection", onConnection);

try {
  runMigrations();
} catch (error) {
  console.error("Failed to run migrations:", error);
  process.exit(1);
}

startCleanupJob();

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("server running at http://localhost:" + PORT);
});
