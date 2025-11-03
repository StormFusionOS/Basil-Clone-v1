import axios from 'axios';
import { CheckoutPayload, CheckoutResult, LineItem } from './types';

const api = axios.create({
  baseURL: 'https://localhost:8443',
  withCredentials: true
});

export interface ScanResult {
  sku: string;
  title: string;
  priceCents: number;
  taxExempt?: boolean;
}

export const scanBarcode = async (barcode: string): Promise<ScanResult> => {
  const response = await api.get(`/scan`, { params: { barcode } });
  return response.data;
};

export const searchTitles = async (query: string) => {
  const response = await api.get('/search', { params: { q: query } });
  return response.data as { highlights: string; title: string; isbn13: string }[];
};

export const checkout = async (payload: CheckoutPayload): Promise<CheckoutResult> => {
  const response = await api.post('/orders/checkout', payload);
  return response.data;
};

export const loadReceipt = async (orderId: string) => {
  const response = await api.get(`/orders/${orderId}/receipt`);
  return response.data as { commands: string[]; zpl?: string[] };
};

export const fetchOpenCart = async () => {
  const response = await api.get('/register/cart');
  return response.data as { items: LineItem[] };
};

export const saveOpenCart = async (items: LineItem[]) => {
  await api.put('/register/cart', { items });
};

export const fetchManagerApproval = async (pin: string) => {
  const response = await api.post('/auth/manager-approval', { pin });
  return response.data as { approved: boolean; managerId?: string };
};
