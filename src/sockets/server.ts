import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { parse as parseCookie } from "cookie";
import { env } from "../config/env.js";
import { verifyAppToken } from "../auth/appToken.js";
import { checkRateLimit } from "../services/rateLimiter.js";
import {
  addUserSocket,
  getConnectedUserCount,
  removeSocket,
} from "../services/userSockets.js";
import { getCheckboxChunk, toggleCheckbox } from "../services/checkboxState.js";
import { publishLocation } from "../kafka/locationPipeline.js";
import { validateAndDedupeLocation } from "../services/locationValidation.js";

function getTokenFromSocketHandshake(handshake: {
  auth: Record<string, unknown>;
  headers: Record<string, unknown>;
}) {
  const authToken = handshake.auth?.token;
  if (typeof authToken === "string" && authToken.length > 0) {
    return authToken;
  }

  const header = handshake.headers?.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  // Try cookies (e.g., HttpOnly cookie set by server)
  const cookieHeader = handshake.headers?.cookie;
  if (typeof cookieHeader === "string" && cookieHeader.length > 0) {
    try {
      const parsed = parseCookie(cookieHeader);
      // cookie name used by the app is accessToken
      const cookieToken =
        parsed.accessToken || parsed.access_token || parsed.token;
      if (typeof cookieToken === "string" && cookieToken.length > 0) {
        return cookieToken;
      }
    } catch {
      // ignore parse errors
    }
  }

  return null;
}

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = getTokenFromSocketHandshake(socket.handshake as never);
      if (!token) {
        return next(new Error("Unauthorized socket"));
      }

      const user = verifyAppToken(token);
      socket.data.authenticated = true;
      socket.data.userId = user.sub;
      socket.data.email = user.email;
      return next();
    } catch (err) {
      return next(new Error("Unauthorized socket"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.data.authenticated && socket.data.userId) {
      addUserSocket({
        socketId: socket.id,
        userId: String(socket.data.userId),
      });
    }

    socket.emit("presence", {
      connectedUsers: getConnectedUserCount(),
      isAuthenticated: Boolean(socket.data.authenticated),
      userId: socket.data.userId ?? null,
    });

    socket.on("location:subscribe", () => {
      socket.join("location-room");
    });

    socket.on("location:unsubscribe", () => {
      socket.leave("location-room");
    });

    socket.on("location:update", async (payload) => {
      if (!socket.data.authenticated || !socket.data.userId) {
        socket.emit("error:event", {
          event: "location:update",
          message: "Authentication required",
        });
        return;
      }

      const principal = String(socket.data.userId);
      const rate = await checkRateLimit({
        key: `ws:location:${principal}:${socket.id}`,
        limit: 30,
        windowSeconds: 10,
      });

      if (!rate.allowed) {
        socket.emit("error:event", {
          event: "location:update",
          message: "Rate limit exceeded",
          retryAfterSec: rate.retryAfterSec,
        });
        return;
      }

      const parsed = {
        lat: Number(payload?.lat),
        lng: Number(payload?.lng),
        accuracy: payload?.accuracy ? Number(payload.accuracy) : undefined,
        timestamp: Number(payload?.timestamp ?? Date.now()),
      };

      const valid = await validateAndDedupeLocation(principal, parsed);
      if (!valid) {
        return;
      }

      await publishLocation({
        userId: principal,
        email: socket.data.email,
        ...parsed,
      });
    });

    socket.on("checkbox:chunk", async (payload) => {
      const start = Number(payload?.start ?? 0);
      const count = Number(payload?.count ?? 2000);
      const chunk = await getCheckboxChunk(start, count);
      socket.emit("checkbox:chunk", chunk);
    });

    socket.on("checkbox:toggle", async (payload) => {
      if (!socket.data.authenticated || !socket.data.userId) {
        socket.emit("error:event", {
          event: "checkbox:toggle",
          message: "Read-only mode for anonymous clients",
        });
        return;
      }

      const principal = String(socket.data.userId);
      const rate = await checkRateLimit({
        key: `ws:checkbox:${principal}:${socket.id}`,
        limit: 120,
        windowSeconds: 10,
      });

      if (!rate.allowed) {
        socket.emit("error:event", {
          event: "checkbox:toggle",
          message: "Toggle rate limit exceeded",
          retryAfterSec: rate.retryAfterSec,
        });
        return;
      }

      const index = Number(payload?.index);
      const checked = Boolean(payload?.checked);
      const event = await toggleCheckbox(index, checked, principal);

      if (!event) {
        socket.emit("error:event", {
          event: "checkbox:toggle",
          message: "Invalid checkbox index",
        });
      }
    });

    socket.on("disconnect", () => {
      removeSocket(socket.id);
      io.emit("presence", {
        connectedUsers: getConnectedUserCount(),
      });
    });
  });

  return io;
}
