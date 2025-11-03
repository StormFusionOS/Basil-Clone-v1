import { BadRequestException } from '@nestjs/common';
import fc from 'fast-check';
import { randomUUID } from 'crypto';
import { Role } from '../common/enums/role.enum';
import { InventoryService } from './inventory.service';
import { RecordStockMovementDto } from './dto/record-stock-movement.dto';

interface InventoryRow {
  item_id: string;
  store_id: string;
  qty_on_hand: number;
  qty_reserved: number;
  bin: string | null;
  updated_at: Date;
}

interface MovementRow {
  id: string;
  item_id: string;
  store_id: string;
  type: string;
  qty: number;
  ref_type: string | null;
  ref_id: string | null;
  user_id: string | null;
  ts: Date;
}

class InMemoryInventoryDelegate {
  private readonly rows = new Map<string, InventoryRow>();

  private key(itemId: string, storeId: string): string {
    return `${itemId}:${storeId}`;
  }

  async findMany(args: { where: { store_id: string } }): Promise<InventoryRow[]> {
    return Array.from(this.rows.values()).filter(
      (row) => row.store_id === args.where.store_id
    );
  }

  async findUnique(args: {
    where: { item_id_store_id: { item_id: string; store_id: string } };
  }): Promise<InventoryRow | null> {
    return (
      this.rows.get(this.key(args.where.item_id_store_id.item_id, args.where.item_id_store_id.store_id)) ??
      null
    );
  }

  async update(args: {
    where: { item_id_store_id: { item_id: string; store_id: string } };
    data: { qty_reserved?: number; bin?: string | null };
  }): Promise<InventoryRow> {
    const key = this.key(args.where.item_id_store_id.item_id, args.where.item_id_store_id.store_id);
    const existing = this.rows.get(key);
    if (!existing) {
      throw new Error('Inventory row not found');
    }

    const updated: InventoryRow = {
      ...existing,
      qty_reserved:
        args.data.qty_reserved !== undefined ? args.data.qty_reserved : existing.qty_reserved,
      bin: args.data.bin !== undefined ? args.data.bin : existing.bin,
      updated_at: new Date()
    };

    this.rows.set(key, updated);
    return updated;
  }

  async upsert(args: {
    where: { item_id_store_id: { item_id: string; store_id: string } };
    update: { qty_on_hand: number };
    create: { item_id: string; store_id: string; qty_on_hand: number; qty_reserved: number };
  }): Promise<InventoryRow> {
    const key = this.key(args.where.item_id_store_id.item_id, args.where.item_id_store_id.store_id);
    const existing = this.rows.get(key);

    if (existing) {
      const updated: InventoryRow = {
        ...existing,
        qty_on_hand: args.update.qty_on_hand,
        updated_at: new Date()
      };
      this.rows.set(key, updated);
      return updated;
    }

    const created: InventoryRow = {
      item_id: args.create.item_id,
      store_id: args.create.store_id,
      qty_on_hand: args.create.qty_on_hand,
      qty_reserved: args.create.qty_reserved,
      bin: null,
      updated_at: new Date()
    };
    this.rows.set(key, created);
    return created;
  }
}

class InMemoryStockMovementDelegate {
  readonly rows: MovementRow[] = [];

  async aggregate(args: {
    where: { item_id: string; store_id: string };
    _sum: { qty: true };
  }): Promise<{ _sum: { qty: number | null } }> {
    const relevant = this.rows.filter(
      (row) => row.item_id === args.where.item_id && row.store_id === args.where.store_id
    );
    if (relevant.length === 0) {
      return { _sum: { qty: null } };
    }

    const total = relevant.reduce((acc, row) => acc + row.qty, 0);

    return { _sum: { qty: total } };
  }

  async create(args: {
    data: {
      item_id: string;
      store_id: string;
      type: string;
      qty: number;
      ref_type: string | null;
      ref_id: string | null;
      user_id: string | null;
    };
  }): Promise<MovementRow> {
    const created: MovementRow = {
      id: randomUUID(),
      item_id: args.data.item_id,
      store_id: args.data.store_id,
      type: args.data.type,
      qty: args.data.qty,
      ref_type: args.data.ref_type,
      ref_id: args.data.ref_id,
      user_id: args.data.user_id,
      ts: new Date()
    };
    this.rows.push(created);
    return created;
  }
}

class InMemoryPrismaService {
  readonly inventory = new InMemoryInventoryDelegate();
  readonly stock_movements = new InMemoryStockMovementDelegate();

  async $transaction<T>(handler: (tx: this) => Promise<T>): Promise<T> {
    return handler(this);
  }
}

describe('InventoryService property-based invariants', () => {
  const storeId = 'store-1';
  const itemId = 'item-1';

  it('prevents negative stock for clerks without override', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.integer({ min: -5, max: 10 }), { maxLength: 25 }),
        async (quantities) => {
          const prisma = new InMemoryPrismaService();
          const service = new InventoryService(prisma as unknown as any);

          for (const quantity of quantities) {
            const movement: RecordStockMovementDto = {
              storeId,
              type: quantity >= 0 ? 'RECEIPT' : 'SALE',
              quantity,
              override: false
            };

            if (quantity < 0) {
              const current = prisma.stock_movements.rows
                .filter((row) => row.item_id === itemId && row.store_id === storeId)
                .reduce((acc, row) => acc + row.qty, 0);

              if (current + quantity < 0) {
                await expect(
                  service.recordMovement(itemId, movement, { role: Role.Clerk })
                ).rejects.toBeInstanceOf(BadRequestException);
              } else {
                await service.recordMovement(itemId, movement, { role: Role.Clerk });
              }
            } else {
              await service.recordMovement(itemId, movement, { role: Role.Clerk });
            }

            const onHand = prisma.stock_movements.rows
              .filter((row) => row.item_id === itemId && row.store_id === storeId)
              .reduce((acc, row) => acc + row.qty, 0);

            expect(onHand).toBeGreaterThanOrEqual(0);

            const inventory = await service.getInventory(storeId);
            if (inventory.length) {
              expect(inventory[0].qtyOnHand).toBe(onHand);
            }
          }
        }
      ),
      { numRuns: 25 }
    );
  });

  it('allows manager override to drive stock negative explicitly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            qty: fc.integer({ min: -7, max: 12 }),
            override: fc.boolean()
          }),
          { maxLength: 25 }
        ),
        async (operations) => {
          const prisma = new InMemoryPrismaService();
          const service = new InventoryService(prisma as unknown as any);

          let expectedOnHand = 0;
          let successfulMovements = 0;

          for (const op of operations) {
            const movement: RecordStockMovementDto = {
              storeId,
              type: op.qty >= 0 ? 'RECEIPT' : 'SALE',
              quantity: op.qty,
              override: op.override
            };

            const attempt = service.recordMovement(itemId, movement, { role: Role.Manager });

            if (op.qty < 0 && expectedOnHand + op.qty < 0 && !op.override) {
              await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
            } else {
              await expect(attempt).resolves.toBeDefined();
              expectedOnHand += op.qty;
              successfulMovements += 1;
            }

            const storedOnHand = prisma.stock_movements.rows
              .filter((row) => row.item_id === itemId && row.store_id === storeId)
              .reduce((acc, row) => acc + row.qty, 0);

            expect(storedOnHand).toBe(expectedOnHand);

            const inventoryRecord = await service.getInventory(storeId);
            if (inventoryRecord.length) {
              expect(inventoryRecord[0].qtyOnHand).toBe(expectedOnHand);
            }

            expect(prisma.stock_movements.rows.length).toBe(successfulMovements);
          }
        }
      ),
      { numRuns: 25 }
    );
  });
});
