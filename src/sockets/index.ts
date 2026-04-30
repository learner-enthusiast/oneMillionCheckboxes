import { Server } from "socket.io";
import { requireSocketAuth } from "./auth.socket.ts";

// app modules
import { registerCheckboxEvents } from "./apps/checkbox.socket.ts";
import { registerLocationEvents } from "./apps/location.socket.ts";

export const initSockets = (io: Server) => {
  // global auth
  io.use(requireSocketAuth);

  io.on("connection", (socket) => {
    console.log("Connected:", socket.data.user);

    /**
     * Register app-specific events
     */
    registerCheckboxEvents(io, socket);
    registerLocationEvents(io, socket);
  });
};
