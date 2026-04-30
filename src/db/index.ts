import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
