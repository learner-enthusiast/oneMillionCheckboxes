import "dotenv/config";
import { Kafka, logLevel, type ITopicConfig } from "kafkajs";

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092")
  .split(",")
  .map((b) => b.trim())
  .filter(Boolean);

if (brokers.length === 0) {
  throw new Error("KAFKA_BROKERS is empty");
}

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID ?? "one-million-checkboxes-admin",
  brokers,
  logLevel: logLevel.INFO,
});

const topics: ITopicConfig[] = [
  {
    topic: process.env.KAFKA_TOPIC_LOCATION ?? "location-updates",
    numPartitions: Number(process.env.KAFKA_LOCATION_PARTITIONS ?? 3),
    replicationFactor: Number(process.env.KAFKA_REPLICATION_FACTOR ?? 1),
  },
  {
    topic: process.env.KAFKA_TOPIC_CHECKBOX ?? "checkbox-updates",
    numPartitions: Number(process.env.KAFKA_CHECKBOX_PARTITIONS ?? 3),
    replicationFactor: Number(process.env.KAFKA_REPLICATION_FACTOR ?? 1),
  },
];

export async function createKafkaTopics() {
  const admin = kafka.admin();

  try {
    await admin.connect();

    const created = await admin.createTopics({
      waitForLeaders: true,
      topics,
    });

    const names = topics.map((t) => t.topic).join(", ");
    console.log(
      created
        ? `Topics created (or updated by broker settings): ${names}`
        : `Topics already existed: ${names}`,
    );

    const meta = await admin.fetchTopicMetadata({
      topics: topics.map((t) => t.topic),
    });
    console.log("Topic metadata:", JSON.stringify(meta.topics, null, 2));
  } finally {
    await admin.disconnect();
  }
}

// Allow direct execution: `npx tsx src/kafka/kafka-admin.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  createKafkaTopics().catch((err) => {
    console.error("Failed to create Kafka topics:", err);
    process.exit(1);
  });
}
