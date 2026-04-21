import { pgTable, serial, timestamp, text } from 'drizzle-orm/pg-core';

export const serverLogs = pgTable('server_logs', {
  id: serial('id').primaryKey(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  message: text('message').notNull(),
});
