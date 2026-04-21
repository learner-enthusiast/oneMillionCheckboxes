import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'fs';
import dotenv from 'dotenv';

// -------------------- CONFIG --------------------
dotenv.config();

const PORT = process.env.PORT || 3000;
const LOG_FILE = process.env.LOG_FILE || 'server.log';

// -------------------- OPTIONAL DB --------------------
let getDrizzleDb, serverLogs;
try {
  const dbModule = await import('./drizzle/db.js');
  const schemaModule = await import('./drizzle/schema.js');
  getDrizzleDb = dbModule.getDrizzleDb;
  serverLogs = schemaModule.serverLogs;
} catch {
  console.log('DB not available, using file logging only');
}

// -------------------- LOGGER --------------------
async function logEvent(message) {
  const timestamp = new Date();
  const logLine = `[${timestamp.toISOString()}] ${message}\n`;

  // Always log to file
  fs.appendFile(LOG_FILE, logLine, (err) => {
    if (err) console.error('File log error:', err.message);
  });

  // Try DB (non-blocking)
  if (getDrizzleDb && serverLogs) {
    try {
      const db = await getDrizzleDb();
      await db.insert(serverLogs).values({ timestamp, message });
    } catch {
      // silently ignore DB failures
    }
  }
}

// -------------------- EXPRESS --------------------
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // tighten in production
  },
});

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, 'public')));

// -------------------- STATE --------------------
const TOTAL_CHECKBOXES = 1_000_000;
const checkboxStates = new Uint8Array(TOTAL_CHECKBOXES);
let connectedUsers = 0;

// -------------------- SOCKET --------------------
io.on('connection', (socket) => {
  connectedUsers++;
  logEvent(`User connected. Total: ${connectedUsers}`);

  // Send initial state
  socket.emit('init', {
    states: checkboxStates,
    users: connectedUsers,
  });

  io.emit('users', connectedUsers);

  socket.on('checkbox-update', ({ idx, checked }) => {
    // validation
    if (
      typeof idx !== 'number' ||
      idx < 0 ||
      idx >= TOTAL_CHECKBOXES ||
      typeof checked !== 'boolean'
    ) {
      return;
    }

    checkboxStates[idx] = checked ? 1 : 0;

    // broadcast to others
    socket.broadcast.emit('checkbox-update', { idx, checked });
  });

  socket.on('disconnect', () => {
    connectedUsers--;
    logEvent(`User disconnected. Total: ${connectedUsers}`);
    io.emit('users', connectedUsers);
  });
});

// -------------------- START --------------------
server.listen(PORT, () => {
  const msg = `Server running on http://localhost:${PORT}`;
  console.log(msg);
  logEvent(msg);
});

// -------------------- ERROR HANDLING --------------------
process.on('uncaughtException', (err) => {
  logEvent('Uncaught Exception: ' + err.stack);
  console.error(err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logEvent('Unhandled Rejection: ' + err);
  console.error(err);
});

process.on('SIGTERM', () => {
  logEvent('SIGTERM received. Shutting down.');
  process.exit(0);
});

process.on('SIGINT', () => {
  logEvent('SIGINT received. Shutting down.');
  process.exit(0);
});