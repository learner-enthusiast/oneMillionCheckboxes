import { io, type Socket } from "socket.io-client";

import { getApiBaseUrl } from "@/BackendRoutes/axios";
import { getAccessTokenFromCookies } from "@/state/cookie";

let socket: Socket | null = null;
let currentToken: string | null = null;

export function createSocketConnection(accessToken?: string | null) {
  const token = accessToken?.trim() ?? getAccessTokenFromCookies();

  if (!token) {
    throw new Error("Access token required for socket connection");
  }

  // Reuse socket if same token
  if (socket && currentToken === token) {
    return socket;
  }

  // Disconnect old socket if token changed
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io(getApiBaseUrl(), {
    transports: ["websocket"],
    auth: {
      token,
    },
  });

  currentToken = token;
  return socket;
}

export function connectSocket(accessToken?: string | null) {
  const client = createSocketConnection(accessToken);
  if (!client.connected) {
    client.connect();
  }
  return client;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = null;
}
