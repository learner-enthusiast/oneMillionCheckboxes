import { Server, Socket } from "socket.io";
import { publishLocation } from "../../kafka/kafka-producer";

export const registerLocationEvents = (io: Server, socket: Socket) => {
  socket.on("location:update", ({ lat, lng }: { lat: number; lng: number }) => {
    const user = socket.data.user;
    // console.log(lat, lng, user);
    publishLocation({
      userId: user?.id,
      username: user?.username,
      lat,
      lng,
    });
    // socket.broadcast.emit("location:updated", {
    //   userId: user?.id,
    //   username: user?.username,
    //   lat,
    //   lng,
    // });
  });
};
