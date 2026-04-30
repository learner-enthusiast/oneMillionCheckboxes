import { Server, Socket } from "socket.io";

export const registerLocationEvents = (io: Server, socket: Socket) => {
  socket.on("location:update", ({ lat, lng }: { lat: number; lng: number }) => {
    const userId = socket.data.user?.id;

    console.log(`User ${userId} moved to`, lat, lng);

    // broadcast to others
    socket.broadcast.emit("location:updated", {
      userId,
      lat,
      lng,
    });
  });
};
