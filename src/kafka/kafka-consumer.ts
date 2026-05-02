import { ENV } from "../utils/constants.ts";
import { kafka, TOPICS } from "./kafka-client.ts";

type LocationEvent = {
  userId: number;
  username: string;
  lat: number;
  lng: number;
  ts: number;
};

type CheckboxEvent = {
  userId: number;
  username: string;
  index: number;
  checked: boolean;
  ts: number;
};

type Handlers = {
  onLocation?: (event: LocationEvent) => Promise<void> | void;
  onCheckbox?: (event: CheckboxEvent) => Promise<void> | void;
};

const consumer = kafka.consumer({
  groupId: ENV.KAFKA_GROUP_ID ?? "one-million-checkboxes-consumer",
});

export async function connectConsumer() {
  await consumer.connect();
}

export async function disconnectConsumer() {
  await consumer.disconnect();
}

export async function startConsumer(handlers: Handlers = {}) {
  await consumer.subscribe({ topic: TOPICS.location, fromBeginning: true });
  await consumer.subscribe({ topic: TOPICS.checkbox, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;

      const raw = message.value.toString();

      try {
        if (topic === TOPICS.location && handlers.onLocation) {
          const event = JSON.parse(raw) as LocationEvent;
          await handlers.onLocation(event);
          return;
        }

        if (topic === TOPICS.checkbox && handlers.onCheckbox) {
          const event = JSON.parse(raw) as CheckboxEvent;
          await handlers.onCheckbox(event);
          return;
        }
      } catch (error) {
        console.error("Kafka message parse/handle error:", {
          topic,
          raw,
          error,
        });
      }
    },
  });
}
