export interface LineItem {
  id: string;
  sku: string;
  title: string;
  qty: number;
  priceCents: number;
  discountCents: number;
  overrideReason?: string;
}

export interface TenderSplit {
  id: string;
  type: 'cash' | 'card' | 'gift_card' | 'store_credit';
  amountCents: number;
  reference?: string;
}

export interface CheckoutResult {
  orderId: string;
  receiptUrl?: string;
  loyaltyBalance?: number;
}

export interface CheckoutPayload {
  items: LineItem[];
  tender: TenderSplit[];
  customerId?: string;
  override?: boolean;
}
