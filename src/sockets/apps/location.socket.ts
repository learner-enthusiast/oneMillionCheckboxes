import { Server, Socket } from "socket.io";

export const registerLocationEvents = (io: Server, socket: Socket) => {
  socket.on("location:update", ({ lat, lng }: { lat: number; lng: number }) => {
    const user = socket.data.user;
    // console.log(lat, lng, user);

    socket.broadcast.emit("location:updated", {
      userId: user?.id,
      username: user?.username,
      lat,
      lng,
    });
  });
};
