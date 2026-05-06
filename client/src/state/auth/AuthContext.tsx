/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAccessTokenFromCookies } from "../cookie";
import { ENV } from "@/lib/utils";

type AuthUser = {
  userId?: string | number;
  email?: string;
  username?: string;
};

type AuthContextValue = {
  accessToken: string | null;
  user: AuthUser | null;
  refreshFromCookies: () => void;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
};

type LoginApiResponse = {
  data?: {
    user?: AuthUser;
    tokens?: {
      accessToken?: string;
    };
  };
  user?: AuthUser;
  tokens?: {
    accessToken?: string;
  };
};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payloadB64] = token.split(".");
    if (!payloadB64) return null;

    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "=",
    );
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function userFromAccessToken(token: string): AuthUser | null {
  const p = decodeJwtPayload(token);
  if (!p) return null;

  return {
    userId:
      (p.userId as string | number | undefined) ??
      (p.sub as string | number | undefined),
    email: typeof p.email === "string" ? p.email : undefined,
    username: typeof p.username === "string" ? p.username : undefined,
  };
}

function clearAccessTokenCookie() {
  // expire cookie
  document.cookie = `accessToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    getAccessTokenFromCookies(),
  );

  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getAccessTokenFromCookies();
    return t ? userFromAccessToken(t) : null;
  });

  const refreshFromCookies = useCallback(() => {
    const t = getAccessTokenFromCookies();
    setAccessToken(t);
    setUser(t ? userFromAccessToken(t) : null);
  }, []);

  const login = useCallback(
    async (emailOrUsername: string, password: string) => {
      const apiBase = ENV.API_URL ?? "";

      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Login failed");
      }

      const jsonUnknown: unknown = await res.json();
      const json = jsonUnknown as LoginApiResponse;

      const token =
        json?.data?.tokens?.accessToken ?? json?.tokens?.accessToken;

      if (!token) {
        throw new Error("Missing access token");
      }

      // Store token in a cookie so ProtectedRoute can read it.
      // (This requires a non-HttpOnly cookie; for production prefer HttpOnly + session-based auth.)
      document.cookie = `accessToken=${encodeURIComponent(token)}; Path=/; SameSite=Lax`;

      setAccessToken(token);

      // Prefer API-provided user, fallback to decoding token.
      const nextUser =
        json?.data?.user ?? json?.user ?? userFromAccessToken(token);
      setUser(nextUser);
    },
    [],
  );

  const logout = useCallback(() => {
    clearAccessTokenCookie();
    setAccessToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      user,
      refreshFromCookies,
      login,
      logout,
    }),
    [accessToken, user, refreshFromCookies, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
