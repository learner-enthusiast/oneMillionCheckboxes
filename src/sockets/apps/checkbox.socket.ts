import { Server, Socket } from "socket.io";
import { publisher, redis, subscriber } from "../../redis/redis-connection.ts";

export const registerCheckboxEvents = async (io: Server, socket: Socket) => {
  /**
   * Join chunk (important for scaling)
   */
  socket.on("checkbox:join", (chunkId: number) => {
    socket.join(`checkbox:${chunkId}`);
  });

  /**
   * Update checkbox
   */
  socket.on("checkbox:update", async ({ index }: { index: number }) => {
    const chunkId = Math.floor(index / 1000);

    console.log(`User ${socket.data.user?.id} updated checkbox ${index}`);
    const existingState = await redis.get("CHECKBOX_STATE_KEY");

    if (existingState) {
      const remoteData = JSON.parse(existingState);
      remoteData[index] = !remoteData[index];
      await redis.set("CHECKBOX_STATE_KEY", JSON.stringify(remoteData));
    } else {
      await redis.set(
        "CHECKBOX_STATE_KEY",
        JSON.stringify(Array(100).fill(false)),
      );
    }

    const data = {
      index,
      user: socket.data.user.username,
    };

    await publisher.publish("client:checkbox-update", JSON.stringify(data));

    //emit only to relevant chunk
  });

  await subscriber.subscribe("client:checkbox-update");
  subscriber.on("message", (channel, message) => {
    const parsed = JSON.parse(message);

    socket.broadcast.emit("checkbox:updated", parsed);
  });
};
