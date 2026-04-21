import { getDrizzleDb } from './db.js';
import { serverLogs } from './schema.js';

export async function migrate() {
  const db = await getDrizzleDb();
  // Create table if not exists
  await db.execute(`
    CREATE TABLE IF NOT EXISTS server_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
      message TEXT NOT NULL
    );
  `);
  console.log('Migration complete: server_logs table is ready.');
}

if (process.argv[1].endsWith('migrate.js')) {
  migrate().then(() => process.exit(0));
}
