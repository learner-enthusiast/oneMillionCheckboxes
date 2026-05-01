import Redis from "ioredis";

export const createReddisConnection = () => {
  return new Redis({
    host: "localhost",
    port: 6379,
  });
};

export const publisher = createReddisConnection();
export const subscriber = createReddisConnection();
export const redis = createReddisConnection();
