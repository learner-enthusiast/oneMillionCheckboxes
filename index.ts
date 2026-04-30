import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { assertDbConnected } from "./src/db/index.ts";
import oidcRouter from "./src/routes/oidc.routes.ts";
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
app.get("/health", (_req: express.Request, res: express.Response) => {
  return res.json({ health: "good" });
});

async function start() {
  try {
    await assertDbConnected();
    console.log("db connected");
  } catch (err) {
    console.error("db connection failed:", err);
    process.exit(1);
  }

  const port = Number(process.env.PORT ?? 3000);
  app.listen(port, () => console.log(`App is listening at PORT : ${port}`));
}

start();
