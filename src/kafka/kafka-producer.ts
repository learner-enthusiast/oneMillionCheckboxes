import { kafka, TOPICS } from "./kafka-client.ts";

type LocationEvent = {
  userId: number;
  username: string;
  lat: number;
  lng: number;
};

type CheckboxEvent = {
  userId: number;
  username: string;
  index: number;
  checked: boolean;
};

const producer = kafka.producer();

export async function connectProducer() {
  await producer.connect();
}

export async function disconnectProducer() {
  await producer.disconnect();
}

export async function publishLocation(event: LocationEvent) {
  await producer.send({
    topic: TOPICS.location,
    messages: [
      {
        key: String(event.userId),
        value: JSON.stringify(event),
      },
    ],
  });
}

export async function publishCheckbox(event: CheckboxEvent) {
  await producer.send({
    topic: TOPICS.checkbox,
    messages: [
      {
        key: String(event.userId),
        value: JSON.stringify(event),
      },
    ],
  });
}
