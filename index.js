import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';

import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// -------------------- LOG SETUP --------------------
const LOG_FILE = process.env.LOG_FILE || 'server.log';

function logEvent(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;

  // Non-blocking write (better than appendFileSync)
  fs.appendFile(LOG_FILE, logLine, (err) => {
    if (err) {
      console.error('Log write error:', err.message);
    }
  });
}

// -------------------- EXPRESS + SOCKET --------------------
const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

// Serve static files
app.use(express.static(join(__dirname, 'public')));

// -------------------- APP STATE --------------------
const TOTAL_CHECKBOXES = 1000000;
const checkboxStates = new Uint8Array(TOTAL_CHECKBOXES);
let connectedUsers = 0;

// -------------------- SOCKET LOGIC --------------------
io.on('connection', (socket) => {
  connectedUsers++;

  logEvent(`User connected. Total users: ${connectedUsers}`);

  socket.emit('init', {
    states: checkboxStates,
    users: connectedUsers
  });

  io.emit('users', connectedUsers);

  socket.on('checkbox-update', ({ idx, checked }) => {
    if (typeof idx === 'number' && idx >= 0 && idx < TOTAL_CHECKBOXES) {
      checkboxStates[idx] = checked ? 1 : 0;

      socket.broadcast.emit('checkbox-update', { idx, checked });
    }
  });

  socket.on('disconnect', () => {
    connectedUsers--;

    logEvent(`User disconnected. Total users: ${connectedUsers}`);

    io.emit('users', connectedUsers);
  });
});

// -------------------- START SERVER --------------------
server.listen(3000, () => {
  const msg = 'server running at http://localhost:3000';
  console.log(msg);

  logEvent(msg);
});

// -------------------- ERROR HANDLING --------------------
process.on('uncaughtException', (err) => {
  logEvent('Server crashed: ' + err.stack);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logEvent('Server received SIGTERM and is shutting down.');
  process.exit(0);
});

process.on('SIGINT', () => {
  logEvent('Server received SIGINT and is shutting down.');
  process.exit(0);
});