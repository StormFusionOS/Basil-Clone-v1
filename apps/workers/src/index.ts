import amqplib, { Connection, Channel, ConsumeMessage } from 'amqplib';
import { BookForgeApiClient } from '@bookforge/clients';
import type { Order } from '@bookforge/domain';
import { IsbnEnrichmentConsumer } from './isbnEnrichment';

const amqpUrl = process.env.AMQP_URL ?? 'amqp://bookforge:bookforge_secret@rabbitmq:5672';
const orderQueueName = process.env.ORDER_QUEUE ?? 'bookforge.orders';
const isbnQueueName = process.env.ISBN_QUEUE ?? 'bookforge.isbn_enrichment';

const api = new BookForgeApiClient({ baseURL: process.env.API_URL ?? 'http://api:8080/v1' });

async function startOrderConsumer(connection: Connection) {
  const channel: Channel = await connection.createChannel();
  await channel.assertQueue(orderQueueName, { durable: true });

  channel.consume(orderQueueName, async (message: ConsumeMessage | null) => {
    if (!message) return;
    try {
      const payload = JSON.parse(message.content.toString()) as Order;
      await api.createOrder(payload);
      channel.ack(message);
    } catch (err) {
      console.error('Failed to process order message', err);
      channel.nack(message, false, false);
    }
  });

  console.log(`Workers consuming queue ${orderQueueName}`);
}

async function startIsbnEnrichment(connection: Connection) {
  const channel = await connection.createChannel();
  const consumer = new IsbnEnrichmentConsumer(channel, isbnQueueName);
  await consumer.bootstrap();
  console.log(`Workers consuming queue ${isbnQueueName}`);
}

async function bootstrap() {
  const connection: Connection = await amqplib.connect(amqpUrl);
  await Promise.all([startOrderConsumer(connection), startIsbnEnrichment(connection)]);
}

bootstrap().catch(err => {
  console.error(err);
  process.exit(1);
});
