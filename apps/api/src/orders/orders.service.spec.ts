import { randomUUID } from 'crypto';
import { MetricsService } from '../monitoring/metrics.service';
import { OrdersService } from './orders.service';
import { ApplyStoreCreditDto } from './dto/apply-store-credit.dto';

interface CustomerRow {
  id: string;
  store_credit_cents: number;
  loyalty_points: number;
}

interface OrderRow {
  id: string;
  customer_id: string | null;
  discount_cents: number;
  total_cents: number;
  store_credit_applied_cents: number;
  loyalty_points_awarded: number;
}

interface RedemptionRow {
  id: string;
  customer_id: string;
  order_id: string;
  amount_cents: number;
  loyalty_points_used: number;
  redeemed_by: string | null;
}

class InMemoryPrismaClient {
  readonly customersTable = new Map<string, CustomerRow>();
  readonly ordersTable = new Map<string, OrderRow>();
  readonly redemptions: RedemptionRow[] = [];

  readonly customers = {
    findMany: async () => Array.from(this.customersTable.values()),
    update: async ({ where, data }: { where: { id: string }; data: Partial<CustomerRow> }) => {
      const existing = this.customersTable.get(where.id);
      if (!existing) throw new Error('Customer not found');
      const updated = { ...existing, ...data };
      this.customersTable.set(where.id, updated);
      return updated;
    }
  } as const;

  readonly orders = {
    findMany: async () => Array.from(this.ordersTable.values()),
    create: async ({ data }: { data: OrderRow }) => {
      const row = { ...data };
      this.ordersTable.set(row.id, row);
      return row;
    },
    findUnique: async ({ where, include }: { where: { id: string }; include?: { customer?: boolean } }) => {
      const order = this.ordersTable.get(where.id);
      if (!order) return null;
      if (include?.customer && order.customer_id) {
        const customer = this.customersTable.get(order.customer_id);
        return customer ? { ...order, customer } : { ...order, customer: null };
      }
      return { ...order };
    },
    update: async ({ where, data }: { where: { id: string }; data: Partial<OrderRow> }) => {
      const existing = this.ordersTable.get(where.id);
      if (!existing) throw new Error('Order not found');
      const updated = { ...existing, ...data };
      this.ordersTable.set(where.id, updated);
      return updated;
    }
  } as const;

  readonly store_credit_redemptions = {
    create: async ({ data }: { data: Omit<RedemptionRow, 'id'> }) => {
      const row: RedemptionRow = { id: randomUUID(), ...data };
      this.redemptions.push(row);
      return row;
    }
  } as const;

  async $transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    return callback(this);
  }
}

describe('OrdersService', () => {
  let prisma: InMemoryPrismaClient;
  let metrics: MetricsService;
  let service: OrdersService;
  const orderId = randomUUID();
  const customerId = randomUUID();

  beforeEach(() => {
    prisma = new InMemoryPrismaClient();
    metrics = { incrementSyncFailure: jest.fn() } as unknown as MetricsService;
    service = new OrdersService(metrics, prisma as unknown as any);
    prisma.customersTable.set(customerId, {
      id: customerId,
      store_credit_cents: 2000,
      loyalty_points: 250
    });
    prisma.ordersTable.set(orderId, {
      id: orderId,
      customer_id: customerId,
      discount_cents: 0,
      total_cents: 5000,
      store_credit_applied_cents: 0,
      loyalty_points_awarded: 0
    });
  });

  it('applies store credit using available balance', async () => {
    const payload: ApplyStoreCreditDto = { amount_cents: 1500 };
    const result = await service.applyStoreCredit(orderId, payload);

    expect(result.remainingStoreCredit).toBe(500);
    expect(result.loyaltyPointsRedeemed).toBe(0);
    expect(prisma.redemptions).toHaveLength(1);
    expect(prisma.ordersTable.get(orderId)?.discount_cents).toBe(1500);
    expect(prisma.ordersTable.get(orderId)?.total_cents).toBe(3500);
    expect(prisma.ordersTable.get(orderId)?.store_credit_applied_cents).toBe(1500);
    expect(prisma.ordersTable.get(orderId)?.loyalty_points_awarded).toBe(35);
    expect(prisma.customersTable.get(customerId)?.loyalty_points).toBe(285);
  });

  it('converts loyalty points when store credit is insufficient', async () => {
    const payload: ApplyStoreCreditDto = { amount_cents: 3000 };
    const result = await service.applyStoreCredit(orderId, payload);

    expect(result.loyaltyPointsRedeemed).toBe(200);
    expect(result.loyaltyCentsConverted).toBe(1000);
    expect(result.remainingStoreCredit).toBe(0);
    expect(prisma.customersTable.get(customerId)?.loyalty_points).toBe(70);
    expect(prisma.ordersTable.get(orderId)?.total_cents).toBe(2000);
    expect(prisma.ordersTable.get(orderId)?.store_credit_applied_cents).toBe(3000);
    expect(prisma.ordersTable.get(orderId)?.loyalty_points_awarded).toBe(20);
  });

  it('rejects when exceeding available funds', async () => {
    const payload: ApplyStoreCreditDto = { amount_cents: 7000 };
    await expect(service.applyStoreCredit(orderId, payload)).rejects.toThrow(
      'Insufficient store credit and loyalty points'
    );
  });
});
