import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { ENV } from "../utils/constants";

const { Pool } = pg;
const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
});

const schema = {} as const;

export const db = drizzle(pool, { schema });
export async function assertDbConnected() {
  const client = await pool.connect();
  try {
    await client.query("select 1");
  } catch (e) {
    console.log(e);
  } finally {
    client.release();
  }
}
