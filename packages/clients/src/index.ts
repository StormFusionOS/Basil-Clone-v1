import axios, { AxiosInstance } from 'axios';
import type { Order } from '@bookforge/domain';

export interface TitleEnrichmentPayload {
  isbn13: string;
  title: string;
  subtitle?: string;
  authors: string[];
  publisher?: string;
  publishedAt?: string;
  raw: Record<string, unknown>;
}

type CreateClientOptions = {
  baseURL: string;
  apiKey?: string;
};

export class BookForgeApiClient {
  private readonly http: AxiosInstance;

  constructor({ baseURL, apiKey }: CreateClientOptions) {
    this.http = axios.create({
      baseURL,
      headers: {
        'X-BOOKFORGE-API-KEY': apiKey ?? ''
      }
    });
  }

  async fetchOrders(): Promise<Order[]> {
    const response = await this.http.get<Order[]>('/orders');
    return response.data;
  }

  async createOrder(payload: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const response = await this.http.post<Order>('/orders', payload);
    return response.data;
  }

  async upsertTitleEnrichment(payload: TitleEnrichmentPayload): Promise<void> {
    await this.http.post('/titles/enrichment', payload);
  }
}

export * from './channelAdapters';
export * from './paymentAdapters';
export * from './giftCardAdapters';
export * from './shippingAdapters';
export * from './booksellerAdapters';
