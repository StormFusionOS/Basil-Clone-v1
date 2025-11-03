export type ChannelPortContext = {
  listingId: string;
  sku: string;
  storeId: string;
  payload?: Record<string, unknown>;
  idempotencyKey?: string;
};

export interface ChannelPort {
  readonly name: string;
  upsertListing(ctx: ChannelPortContext): Promise<ChannelPortResult>;
  pauseListing(ctx: ChannelPortContext): Promise<ChannelPortResult>;
  deleteListing(ctx: ChannelPortContext): Promise<ChannelPortResult>;
  fetchOrders?(options?: Record<string, unknown>): Promise<ChannelFetchOrdersResult>;
  acknowledgeOrder?(externalId: string, metadata?: Record<string, unknown>): Promise<void>;
}

export type ChannelPortResult = {
  status: 'success' | 'error' | 'noop';
  externalId?: string;
  message?: string;
  retryable?: boolean;
};

export type ChannelFetchOrdersResult = {
  orders: Array<{
    externalId: string;
    orderNumber?: string;
    payload: Record<string, unknown>;
  }>;
  nextCursor?: string;
};

export interface PaymentPort {
  readonly name: string;
  present(amountCents: number, context: PaymentContext): Promise<PaymentResult>;
  cancel(transactionId: string): Promise<void>;
  refund(transactionId: string, amountCents: number): Promise<PaymentResult>;
}

export type PaymentContext = {
  storeId: string;
  orderId: string;
  clerkId: string;
  metadata?: Record<string, unknown>;
};

export type PaymentResult = {
  status: 'approved' | 'declined' | 'pending';
  transactionId?: string;
  approvalCode?: string;
  message?: string;
};

export interface GiftCardPort {
  readonly name: string;
  issue(amountCents: number, context: GiftCardContext): Promise<GiftCardResult>;
  balance(cardNumber: string): Promise<GiftCardBalance>;
  redeem(cardNumber: string, amountCents: number, context: GiftCardContext): Promise<GiftCardResult>;
  void(cardNumber: string, authorizationCode: string): Promise<void>;
}

export type GiftCardContext = {
  storeId: string;
  clerkId: string;
  orderId?: string;
};

export type GiftCardResult = {
  authorizationCode: string;
  message?: string;
};

export type GiftCardBalance = {
  cardNumber: string;
  amountCents: number;
};

export interface ShippingPort {
  readonly name: string;
  createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResult>;
  voidLabel(labelId: string, options?: Record<string, unknown>): Promise<void>;
  rateShop(request: ShippingRateRequest): Promise<ShippingRateResult>;
}

export interface BooksellerPort {
  readonly name: string;
  pushInventorySnapshot(payload: BooksellerInventoryPayload): Promise<BooksellerResult>;
  exportAudience?(options?: Record<string, unknown>): Promise<BooksellerResult>;
  submitEdi?(document: BooksellerEdiDocument): Promise<BooksellerResult>;
}

export type BooksellerResult = {
  status: 'success' | 'noop' | 'error';
  message?: string;
};

export type BooksellerInventoryPayload = {
  generatedAt: Date;
  storeId: string;
  items: Array<{
    sku: string;
    isbn13?: string;
    qty: number;
    priceCents: number;
  }>;
};

export type BooksellerEdiDocument = {
  vendor: string;
  type: '850' | '855' | '856';
  payload: Record<string, unknown>;
  correlationId: string;
};

export type ShippingLabelRequest = {
  orderId: string;
  storeId: string;
  shipFrom: Address;
  shipTo: Address;
  parcels: Parcel[];
};

export type ShippingLabelResult = {
  labelId: string;
  trackingNumber: string;
  costCents: number;
  labelUrl: string;
  documents?: Record<string, string>;
};

export type ShippingRateRequest = {
  shipFrom: Address;
  shipTo: Address;
  parcels: Parcel[];
  serviceCodes?: string[];
};

export type ShippingRateResult = {
  rates: Array<{
    serviceCode: string;
    carrier: string;
    costCents: number;
    estimatedDeliveryDays?: number;
  }>;
};

export type Address = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type Parcel = {
  lengthIn: number;
  widthIn: number;
  heightIn: number;
  weightOz: number;
};

export type ListingState = 'pending' | 'active' | 'paused' | 'error' | 'retired';

export type ListingEvent =
  | { type: 'publish'; idempotencyKey: string }
  | { type: 'pause'; reason?: string }
  | { type: 'resume' }
  | { type: 'failure'; message: string; retryable?: boolean }
  | { type: 'retire'; reason?: string };

export type ListingSnapshot = {
  listingId: string;
  channel: string;
  state: ListingState;
  updatedAt: Date;
  message?: string;
  retryable?: boolean;
  retryCount: number;
  idempotencyKey?: string;
};

export class ListingStateMachine {
  constructor(private readonly snapshot: ListingSnapshot) {}

  transition(event: ListingEvent): ListingSnapshot {
    const base: ListingSnapshot = {
      ...this.snapshot,
      updatedAt: new Date(),
      retryable: false,
      message: undefined
    };

    switch (event.type) {
      case 'publish':
        if (this.snapshot.state === 'retired') {
          return { ...base, message: 'Listing retired', state: 'retired' };
        }
        if (this.snapshot.idempotencyKey === event.idempotencyKey) {
          return this.snapshot; // idempotent re-apply
        }
        return {
          ...base,
          idempotencyKey: event.idempotencyKey,
          state: 'pending',
          retryCount: 0
        };
      case 'pause':
        return {
          ...base,
          state: 'paused',
          message: event.reason
        };
      case 'resume':
        if (this.snapshot.state === 'retired') {
          return { ...base, state: 'retired', message: 'Listing retired' };
        }
        return {
          ...base,
          state: 'active',
          retryCount: 0
        };
      case 'failure':
        return {
          ...base,
          state: event.retryable ? 'paused' : 'error',
          message: event.message,
          retryable: Boolean(event.retryable),
          retryCount: event.retryable ? this.snapshot.retryCount + 1 : this.snapshot.retryCount
        };
      case 'retire':
        return {
          ...base,
          state: 'retired',
          message: event.reason,
          retryCount: 0
        };
      default:
        return this.snapshot;
    }
  }
}

export const createListingSnapshot = (input: {
  listingId: string;
  channel: string;
  state?: ListingState;
  message?: string;
}): ListingSnapshot => ({
  listingId: input.listingId,
  channel: input.channel,
  state: input.state ?? 'pending',
  message: input.message,
  retryable: false,
  retryCount: 0,
  updatedAt: new Date(),
  idempotencyKey: undefined
});
