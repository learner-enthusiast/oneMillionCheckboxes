import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { assertDbConnected } from "./src/db/index.ts";
import oidcRouter from "./src/routes/oidc.routes.ts";
import http from "http";
import { Server } from "socket.io";
import { initSockets } from "./src/sockets/index.ts";
import { ApiResponse } from "./src/utils/ApiResponse.ts";
import { redis } from "./src/redis/redis-connection.ts";
import { requireAuth } from "./src/middlewares/auth.middleware.ts";
import { initRedisSubscriber } from "./src/redis/redis-subscriber.ts";
dotenv.config();

const app = express();
const whitelist = [
  "http://localhost:5174",
  "http://localhost:3000",
  "https://yourapp.com",
];

app.use(
  cors({
    origin(origin, callback) {
      // allow Postman/server-to-server (no origin)
      if (!origin) {
        return callback(null, true);
      }

      if (whitelist.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use("/api/oauth2", oidcRouter);
app.get(
  "/health",
  requireAuth,
  (_req: express.Request, res: express.Response) => {
    return res.json({ health: "good" });
  },
);
app.get("/api/checkboxState", async (_, res) => {
  const checkboxState = await redis.get("CHECKBOX_STATE_KEY");
  return res.json(
    new ApiResponse(
      200,
      { checkboxState },
      "Checkbox state fetched succesfully",
    ),
  );
});
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: whitelist,
    credentials: true,
  },
});
initSockets(io);
initRedisSubscriber(io);
async function start() {
  try {
    await assertDbConnected();
    console.log("db connected");
  } catch (err) {
    console.error("db connection failed:", err);
    process.exit(1);
  }

  const port = Number(process.env.PORT ?? 3000);

  server.listen(port, () => {
    console.log(`App + Socket.IO running at PORT : ${port}`);
  });
}

start();
