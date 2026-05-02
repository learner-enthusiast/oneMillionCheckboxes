import "dotenv/config";
import { Kafka, logLevel } from "kafkajs";
import { ENV } from "../utils/constants";

const brokers = ENV.KAFKA_BROKERS.map((b) => b.trim()).filter(Boolean);

if (brokers.length === 0) {
  throw new Error("KAFKA_BROKERS is empty");
}

export const kafka = new Kafka({
  clientId: ENV.KAFKA_CLIENT_ID ?? "one-million-checkboxes-app",
  brokers,
  logLevel: logLevel.INFO,
});

export const TOPICS = {
  location: ENV.KAFKA_TOPIC_LOCATION ?? "location-updates",
  checkbox: ENV.KAFKA_TOPIC_CHECKBOX ?? "checkbox-updates",
} as const;
