import "dotenv/config";
import { Kafka, logLevel } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

if (brokers.length === 0) {
  throw new Error("KAFKA_BROKERS is empty");
}

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID ?? "one-million-checkboxes-app",
  brokers,
  logLevel: logLevel.INFO,
});

export const TOPICS = {
  location: process.env.KAFKA_TOPIC_LOCATION ?? "location-updates",
  checkbox: process.env.KAFKA_TOPIC_CHECKBOX ?? "checkbox-updates",
} as const;
