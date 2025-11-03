import fs from 'node:fs';
import path from 'node:path';
import amqplib from 'amqplib';

const amqpUrl = process.env.AMQP_URL ?? 'amqp://bookforge:bookforge_secret@rabbitmq:5672';
const queueName = process.env.ISBN_QUEUE ?? 'bookforge.isbn_enrichment';

async function main() {
  const fileArg = process.argv[2];
  if (!fileArg) {
    console.error('Usage: ts-node replay-isbn.ts <path-to-json>');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(path.resolve(fileArg), 'utf-8')) as unknown;
  if (!Array.isArray(payload)) {
    throw new Error('Replay file must contain an array of ISBN enrichment messages');
  }

  const connection = await amqplib.connect(amqpUrl);
  const channel = await connection.createChannel();
  await channel.assertQueue(queueName, { durable: true });

  for (const message of payload) {
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), { persistent: true });
  }

  await channel.close();
  await connection.close();
  console.log(`Replayed ${payload.length} messages into ${queueName}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
