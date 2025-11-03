import { randomUUID } from 'crypto';
import { CustomersService } from './customers.service';
import { IssueStoreCreditDto } from './dto/issue-store-credit.dto';

interface CustomerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  marketing_opt_in: boolean;
  store_credit_cents: number;
  loyalty_points: number;
}

interface IssuanceRow {
  id: string;
  customer_id: string;
  amount_cents: number;
  reason: string;
  issued_by: string | null;
  created_at: Date;
}

class InMemoryPrismaClient {
  readonly customersTable = new Map<string, CustomerRow>();
  readonly issuances: IssuanceRow[] = [];

  readonly customers = {
    create: async ({ data }: { data: Omit<CustomerRow, 'id'> }) => {
      const id = randomUUID();
      const row: CustomerRow = { id, ...data };
      this.customersTable.set(id, row);
      return row;
    },
    findMany: async () => Array.from(this.customersTable.values()),
    findUnique: async ({ where }: { where: { id: string } }) =>
      this.customersTable.get(where.id) ?? null,
    update: async ({ where, data }: { where: { id: string }; data: { store_credit_cents: { increment: number } } }) => {
      const existing = this.customersTable.get(where.id);
      if (!existing) {
        throw new Error('not found');
      }
      const updated: CustomerRow = {
        ...existing,
        store_credit_cents: existing.store_credit_cents + data.store_credit_cents.increment
      };
      this.customersTable.set(where.id, updated);
      return updated;
    }
  } as const;

  readonly store_credit_issuances = {
    create: async ({ data }: { data: Omit<IssuanceRow, 'id' | 'created_at'> }) => {
      const row: IssuanceRow = {
        id: randomUUID(),
        created_at: new Date(),
        ...data
      };
      this.issuances.push(row);
      return row;
    }
  } as const;

  async $transaction<T>(callback: (tx: this) => Promise<T>): Promise<T> {
    return callback(this);
  }
}

describe('CustomersService', () => {
  let prisma: InMemoryPrismaClient;
  let service: CustomersService;
  let customerId: string;

  beforeEach(async () => {
    prisma = new InMemoryPrismaClient();
    service = new CustomersService(prisma as unknown as any);
    const customer = {
      name: 'Test Customer',
      email: 'test@example.com',
      phone: null,
      marketing_opt_in: false,
      store_credit_cents: 1000,
      loyalty_points: 0
    } as Omit<CustomerRow, 'id'>;
    const created = await prisma.customers.create({ data: customer });
    customerId = created.id;
  });

  it('issues store credit and records audit trail', async () => {
    const payload: IssueStoreCreditDto = { amount_cents: 500, reason: 'Customer appeasement' };
    const result = await service.issueStoreCredit(customerId, payload);

    expect(result.balanceCents).toBe(1500);
    expect(prisma.issuances).toHaveLength(1);
    expect(prisma.issuances[0]).toMatchObject({
      customer_id: customerId,
      amount_cents: 500,
      reason: 'Customer appeasement'
    });
  });

  it('rejects non-positive amounts', async () => {
    await expect(
      service.issueStoreCredit(customerId, { amount_cents: 0, reason: 'invalid' })
    ).rejects.toThrow('amount_cents must be greater than zero');
  });

  it('rejects when customer does not exist', async () => {
    await expect(
      service.issueStoreCredit(randomUUID(), { amount_cents: 100, reason: 'missing' })
    ).rejects.toThrow('Customer not found');
  });
});
