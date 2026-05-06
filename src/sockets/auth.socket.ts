import { Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.ts";

type AuthenticatedSocket = Socket & {
  data: {
    user?: {
      id: number;
      email?: string;
      username?: string;
    };
  };
};

export const requireSocketAuth = async (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void,
) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Missing token"));
    }

    const payload = await verifyAccessToken(token);

    socket.data.user = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    };

    next();
  } catch {
    const error = new Error("Invalid or expired token");
    (error as any).data = { code: 401 };
    next(error);
  }
};
