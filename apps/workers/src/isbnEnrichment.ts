import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { Channel, ConsumeMessage } from 'amqplib';
import fetch from 'node-fetch';
import { BookForgeApiClient } from '@bookforge/clients';
import type { TitleEnrichmentPayload } from '@bookforge/clients';

export interface IsbnEnrichmentMessage {
  isbn13: string;
  ean?: string;
}

export const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export const normaliseAuthors = (openLibrary: any, googleBooks: any): string[] => {
  const authors: string[] = [];
  if (Array.isArray(openLibrary?.authors)) {
    for (const author of openLibrary.authors) {
      if (typeof author === 'string') {
        authors.push(toTitleCase(author));
      } else if (typeof author?.name === 'string') {
        authors.push(toTitleCase(author.name));
      }
    }
  }
  const googleAuthors: string[] = googleBooks?.items?.[0]?.volumeInfo?.authors ?? [];
  for (const author of googleAuthors) {
    if (typeof author === 'string') {
      const formatted = toTitleCase(author);
      if (!authors.includes(formatted)) authors.push(formatted);
    }
  }
  return authors;
};

export class IsbnEnrichmentConsumer {
  private readonly bucket: string;
  private readonly api: BookForgeApiClient;
  private readonly s3: S3Client;
  private readonly maxAttempts = 5;
  private readonly dlqName: string;

  constructor(
    private readonly channel: Channel,
    private readonly queueName: string,
    options: { api?: BookForgeApiClient; s3?: S3Client } = {}
  ) {
    this.dlqName = `${queueName}.dlq`;
    this.bucket = process.env.MINIO_BUCKET ?? 'bookforge-isbn-cache';
    this.api = options.api ?? new BookForgeApiClient({ baseURL: process.env.API_URL ?? 'http://api:8080/v1' });
    this.s3 =
      options.s3 ??
      new S3Client({
        region: 'us-east-1',
        forcePathStyle: true,
        endpoint: process.env.MINIO_ENDPOINT ?? 'http://minio:9000',
        credentials: {
          accessKeyId: process.env.MINIO_ROOT_USER ?? 'bookforge',
          secretAccessKey: process.env.MINIO_ROOT_PASSWORD ?? 'bookforge_secret'
        }
      });
  }

  async bootstrap(): Promise<void> {
    await this.channel.assertQueue(this.queueName, { durable: true });
    await this.channel.assertQueue(this.dlqName, { durable: true });
    this.channel.consume(this.queueName, msg => this.handleMessage(msg));
  }

  protected async handleMessage(message: ConsumeMessage | null): Promise<void> {
    if (!message) return;

    const payload = JSON.parse(message.content.toString()) as IsbnEnrichmentMessage;
    try {
      const result = await this.enrichIsbn(payload);
      await this.api.upsertTitleEnrichment(result);
      this.channel.ack(message);
    } catch (error) {
      const attempts = this.getAttemptCount(message) + 1;
      if (attempts >= this.maxAttempts) {
        this.channel.sendToQueue(this.dlqName, message.content, {
          headers: { reason: (error as Error).message }
        });
        this.channel.ack(message);
        return;
      }
      const delay = Math.min(30000, 1000 * Math.pow(2, attempts));
      setTimeout(() => {
        this.channel.sendToQueue(this.queueName, message.content, {
          headers: { attempts }
        });
      }, delay);
      this.channel.ack(message);
    }
  }

  private getAttemptCount(message: ConsumeMessage): number {
    const headerAttempts = (message.properties.headers?.attempts ?? 0) as number;
    return Number.isFinite(headerAttempts) ? headerAttempts : 0;
  }

  protected async enrichIsbn(message: IsbnEnrichmentMessage): Promise<TitleEnrichmentPayload> {
    const { isbn13 } = message;
    const [openLibrary, googleBooks] = await Promise.all([
      this.fetchJson(`https://openlibrary.org/isbn/${isbn13}.json`),
      this.fetchJson(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}`)
    ]);

    const normalizedTitle = toTitleCase(openLibrary?.title ?? googleBooks?.title ?? 'Unknown Title');
    const normalizedAuthors = normaliseAuthors(openLibrary, googleBooks);

    const enrichment: TitleEnrichmentPayload = {
      isbn13,
      title: normalizedTitle,
      subtitle: openLibrary?.subtitle ?? undefined,
      authors: normalizedAuthors,
      publisher: openLibrary?.publishers?.[0] ?? googleBooks?.publisher,
      publishedAt: openLibrary?.publish_date ?? googleBooks?.publishedDate,
      raw: { openLibrary, googleBooks }
    };

    await this.cacheRawJson(enrichment);

    return enrichment;
  }

  protected async cacheRawJson(enrichment: TitleEnrichmentPayload): Promise<void> {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: `${enrichment['isbn13']}/${Date.now()}.json`,
        Body: JSON.stringify(enrichment.raw ?? {}),
        ContentType: 'application/json'
      })
    );
  }

  private async fetchJson(url: string): Promise<any> {
    try {
      const response = await fetch(url, { headers: { 'User-Agent': 'bookforge-isbn-worker' } });
      if (!response.ok) return undefined;
      return response.json();
    } catch (error) {
      return undefined;
    }
  }
}
