import dotenv from "dotenv";
dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});
type EnvKey =
  | "PORT"
  | "DATABASE_URL"
  | "KAFKA_BROKERS"
  | "KAFKA_CLIENT_ID"
  | "KAFKA_TOPIC_LOCATION"
  | "KAFKA_LOCATION_PARTITIONS"
  | "KAFKA_REPLICATION_FACTOR"
  | "KAFKA_TOPIC_CHECKBOX"
  | "KAFKA_GROUP_ID"
  | "JWT_ACCESS_SECRET"
  | "JWT_REFRESH_SECRET"
  | "ACCESS_TOKEN_TTL"
  | "REFRESH_TOKEN_TTL"
  | "CORS_ORIGIN"
  | "OIDC_ISSUER";

function requireEnv(key: EnvKey): string {
  const value = process.env[key];

  if (!value || value.trim() === "") {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

// Helpers for parsing
function toNumber(value: string, key: string): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new Error(`${key} must be a number`);
  }
  return num;
}

export const ENV = {
  PORT: toNumber(requireEnv("PORT"), "PORT"),

  DATABASE_URL: requireEnv("DATABASE_URL"),

  KAFKA_BROKERS: requireEnv("KAFKA_BROKERS").split(","),
  KAFKA_CLIENT_ID: requireEnv("KAFKA_CLIENT_ID"),

  KAFKA_TOPIC_LOCATION: requireEnv("KAFKA_TOPIC_LOCATION"),
  KAFKA_LOCATION_PARTITIONS: toNumber(
    requireEnv("KAFKA_LOCATION_PARTITIONS"),
    "KAFKA_LOCATION_PARTITIONS",
  ),

  KAFKA_TOPIC_CHECKBOX: requireEnv("KAFKA_TOPIC_CHECKBOX"),

  KAFKA_REPLICATION_FACTOR: toNumber(
    requireEnv("KAFKA_REPLICATION_FACTOR"),
    "KAFKA_REPLICATION_FACTOR",
  ),

  KAFKA_GROUP_ID: requireEnv("KAFKA_GROUP_ID"),

  JWT_ACCESS_SECRET: requireEnv("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: requireEnv("JWT_REFRESH_SECRET"),

  ACCESS_TOKEN_TTL: requireEnv("ACCESS_TOKEN_TTL"),
  REFRESH_TOKEN_TTL: requireEnv("REFRESH_TOKEN_TTL"),

  CORS_ORIGIN: requireEnv("CORS_ORIGIN"),
  OIDC_ISSUER: requireEnv("OIDC_ISSUER"),
} as const;
