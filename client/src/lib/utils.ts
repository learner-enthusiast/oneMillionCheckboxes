import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
type EnvKey =
  | "VITE_PORT"
  | "VITE_CLIENT_ID"
  | "VITE_REDIRECT_URI"
  | "VITE_OIDC_ISSUER"
  | "VITE_API_URL";

function requireEnv(key: EnvKey): string {
  const value = import.meta.env[key];

  if (!value || value.trim() === "") {
    throw new Error(`Missing Vite environment variable: ${key}`);
  }

  return value;
}

function toNumber(value: string, key: string): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${key} must be a number`);
  }
  return num;
}

export const ENV = {
  PORT: toNumber(requireEnv("VITE_PORT"), "VITE_PORT"),

  CLIENT_ID: requireEnv("VITE_CLIENT_ID"),
  REDIRECT_URI: requireEnv("VITE_REDIRECT_URI"),
  OIDC_ISSUER: requireEnv("VITE_OIDC_ISSUER"),
  API_URL: requireEnv("VITE_API_URL"),
} as const;
