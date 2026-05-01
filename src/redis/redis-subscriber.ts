import { Server } from "socket.io";
import { subscriber } from "./redis-connection.ts";

export const initRedisSubscriber = async (io: Server) => {
  await subscriber.subscribe("client:checkbox-update");

  subscriber.on("message", (channel, message) => {
    const parsed = JSON.parse(message);

    io.emit("checkbox:updated", parsed);
  });
};
