import { Server, Socket } from "socket.io";

export const registerCheckboxEvents = (io: Server, socket: Socket) => {
  /**
   * Join chunk (important for scaling)
   */
  socket.on("checkbox:join", (chunkId: number) => {
    socket.join(`checkbox:${chunkId}`);
  });

  /**
   * Update checkbox
   */
  socket.on(
    "checkbox:update",
    ({ index, value }: { index: number; value: boolean }) => {
      const chunkId = Math.floor(index / 1000);

      console.log(`User ${socket.data.user?.id} updated checkbox ${index}`);

      // TODO: store in Redis bitmap

      // emit only to relevant chunk
      socket.to(`checkbox:${chunkId}`).emit("checkbox:updated", {
        index,
        value,
      });
    },
  );
};
