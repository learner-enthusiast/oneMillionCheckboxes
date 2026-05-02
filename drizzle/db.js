import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import * as schema from "./schema.js";
import dotenv from "dotenv";
dotenv.config();

export async function getDrizzleDb() {
  const client = new Client({ connectionString: ENV.DATABASE_URL });
  await client.connect();
  return drizzle(client, { schema });
}
