import { jest } from '@jest/globals';
import type { ConsumeMessage } from 'amqplib';
import type { BookForgeApiClient } from '@bookforge/clients';
import type { S3Client } from '@aws-sdk/client-s3';
import { IsbnEnrichmentConsumer, normaliseAuthors, toTitleCase } from '../isbnEnrichment';

class StubChannel {
  public asserted: string[] = [];
  public consumed?: (msg: ConsumeMessage | null) => void;
  public acknowledgements: ConsumeMessage[] = [];
  public sent: Array<{ queue: string; content: Buffer; options?: Record<string, any> }> = [];

  async assertQueue(name: string) {
    this.asserted.push(name);
  }

  consume(_queue: string, cb: (msg: ConsumeMessage | null) => void) {
    this.consumed = cb;
  }

  ack(message: ConsumeMessage) {
    this.acknowledgements.push(message);
  }

  nack() {
    throw new Error('nack should not be called in tests');
  }

  sendToQueue(queue: string, content: Buffer, options?: Record<string, any>) {
    this.sent.push({ queue, content, options });
  }
}

class TestConsumer extends IsbnEnrichmentConsumer {
  public enrichImpl?: jest.Mock;
  public cachedPayloads: Record<string, unknown>[] = [];

  constructor(channel: any, queueName: string, options: { api: BookForgeApiClient; s3: S3Client }) {
    super(channel, queueName, options);
  }

  protected async enrichIsbn(message: any) {
    if (this.enrichImpl) {
      return this.enrichImpl(message);
    }
    return super.enrichIsbn(message);
  }

  protected async cacheRawJson(enrichment: Record<string, unknown>): Promise<void> {
    this.cachedPayloads.push(enrichment);
  }

  async invokeHandle(message: ConsumeMessage | null) {
    // @ts-expect-error accessing protected for tests
    return this.handleMessage(message);
  }
}

describe('isbnEnrichment', () => {
  it('normalises author casing and deduplicates', () => {
    const authors = normaliseAuthors(
      {
        authors: [{ name: 'octavia e. butler' }, 'ursula k. le guin']
      },
      {
        items: [
          {
            volumeInfo: {
              authors: ['Octavia E. Butler', 'N. K. Jemisin']
            }
          }
        ]
      }
    );

    expect(authors).toEqual(['Octavia E. Butler', 'Ursula K. Le Guin', 'N. K. Jemisin']);
  });

  it('title casing helper capitalises each word', () => {
    expect(toTitleCase('THE LEFT HAND OF DARKNESS')).toBe('The Left Hand Of Darkness');
  });

  it('acks message and forwards enrichment to API', async () => {
    const channel = new StubChannel();
    const api = { upsertTitleEnrichment: jest.fn().mockResolvedValue(undefined) } as unknown as BookForgeApiClient;
    const s3 = {} as S3Client;
    const consumer = new TestConsumer(channel as any, 'bookforge.isbn', { api, s3 });
    consumer.enrichImpl = jest.fn().mockResolvedValue({ isbn13: '123', title: 'Test', authors: [], raw: {} });

    const message = {
      content: Buffer.from(JSON.stringify({ isbn13: '123' })),
      properties: { headers: {} }
    } as ConsumeMessage;

    await consumer.invokeHandle(message);

    expect(api.upsertTitleEnrichment).toHaveBeenCalledWith({ isbn13: '123', title: 'Test', authors: [], raw: {} });
    expect(channel.acknowledgements).toContain(message);
  });

  it('requeues with backoff and eventually routes to DLQ', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    const channel = new StubChannel();
    const api = { upsertTitleEnrichment: jest.fn() } as unknown as BookForgeApiClient;
    const s3 = {} as S3Client;
    const consumer = new TestConsumer(channel as any, 'bookforge.isbn', { api, s3 });
    consumer.enrichImpl = jest.fn().mockRejectedValue(new Error('network'));

    const message = {
      content: Buffer.from(JSON.stringify({ isbn13: '123' })),
      properties: { headers: {} }
    } as ConsumeMessage;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await consumer.invokeHandle(message);
      jest.runOnlyPendingTimers();
    }

    expect(channel.sent.filter(entry => entry.queue === 'bookforge.isbn')).toHaveLength(4);
    const dlqEntry = channel.sent.find(entry => entry.queue === 'bookforge.isbn.dlq');
    expect(dlqEntry).toBeDefined();
    jest.useRealTimers();
  });
});
