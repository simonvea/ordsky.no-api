import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import registerCollabFeatureHandlers from "./collabFeature/socket.ts";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./collabFeature/types.ts";
import app from "./app.ts";

const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server);

const onConnection = (
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
) => {
  registerCollabFeatureHandlers(io, socket);
};

io.on("connection", onConnection);

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
