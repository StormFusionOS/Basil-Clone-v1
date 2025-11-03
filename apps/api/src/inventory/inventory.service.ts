import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Role } from '../common/enums/role.enum';
import { PrismaService } from '../prisma/prisma.service';
import { RecordStockMovementDto } from './dto/record-stock-movement.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

export interface InventorySnapshot {
  itemId: string;
  storeId: string;
  qtyOnHand: number;
  qtyReserved: number;
  bin: string | null;
  updatedAt: Date;
}

export interface MovementActorContext {
  userId?: string;
  role: Role;
}

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getInventory(storeId: string): Promise<InventorySnapshot[]> {
    const inventoryRows = await this.prisma.inventory.findMany({
      where: { store_id: storeId }
    });

    const results: InventorySnapshot[] = [];
    for (const row of inventoryRows) {
      const aggregate = await this.prisma.stock_movements.aggregate({
        where: { item_id: row.item_id, store_id: row.store_id },
        _sum: { qty: true }
      });

      const qtyOnHand = aggregate._sum.qty ?? 0;
      results.push({
        itemId: row.item_id,
        storeId: row.store_id,
        qtyOnHand,
        qtyReserved: row.qty_reserved,
        bin: row.bin ?? null,
        updatedAt: row.updated_at
      });
    }

    return results;
  }

  async update(itemId: string, payload: UpdateInventoryDto): Promise<InventorySnapshot> {
    return this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findUnique({
        where: {
          item_id_store_id: {
            item_id: itemId,
            store_id: payload.storeId
          }
        }
      });

      if (!inventory) {
        throw new NotFoundException('Inventory record not found');
      }

      const expectedTs = new Date(payload.expectedUpdatedAt);
      if (Number.isNaN(expectedTs.getTime())) {
        throw new BadRequestException('Invalid expectedUpdatedAt value');
      }

      if (inventory.updated_at.getTime() !== expectedTs.getTime()) {
        throw new ConflictException('Inventory version mismatch');
      }

      await tx.inventory.update({
        where: {
          item_id_store_id: {
            item_id: itemId,
            store_id: payload.storeId
          }
        },
        data: {
          qty_reserved: payload.qtyReserved,
          bin: payload.bin ?? null
        }
      });

      const refreshed = await tx.inventory.findUnique({
        where: {
          item_id_store_id: {
            item_id: itemId,
            store_id: payload.storeId
          }
        }
      });

      if (!refreshed) {
        throw new NotFoundException('Inventory record not found after update');
      }

      const aggregate = await tx.stock_movements.aggregate({
        where: { item_id: itemId, store_id: payload.storeId },
        _sum: { qty: true }
      });

      return {
        itemId: refreshed.item_id,
        storeId: refreshed.store_id,
        qtyOnHand: aggregate._sum.qty ?? 0,
        qtyReserved: refreshed.qty_reserved,
        bin: refreshed.bin ?? null,
        updatedAt: refreshed.updated_at
      };
    });
  }

  async recordMovement(
    itemId: string,
    payload: RecordStockMovementDto,
    actor: MovementActorContext
  ): Promise<InventorySnapshot> {
    return this.prisma.$transaction(async (tx) => {
      const aggregateBefore = await tx.stock_movements.aggregate({
        where: { item_id: itemId, store_id: payload.storeId },
        _sum: { qty: true }
      });

      const currentOnHand = aggregateBefore._sum.qty ?? 0;
      const projectedOnHand = currentOnHand + payload.quantity;

      if (payload.quantity < 0 && projectedOnHand < 0) {
        const managerOverride = actor.role === Role.Manager && payload.override === true;
        if (!managerOverride) {
          throw new BadRequestException('Insufficient stock for movement');
        }
      }

      await tx.stock_movements.create({
        data: {
          item_id: itemId,
          store_id: payload.storeId,
          type: payload.type,
          qty: payload.quantity,
          ref_type: payload.refType ?? null,
          ref_id: payload.refId ?? null,
          user_id: actor.userId ?? null
        }
      });

      const inventory = await tx.inventory.upsert({
        where: {
          item_id_store_id: {
            item_id: itemId,
            store_id: payload.storeId
          }
        },
        update: {
          qty_on_hand: projectedOnHand
        },
        create: {
          item_id: itemId,
          store_id: payload.storeId,
          qty_on_hand: projectedOnHand,
          qty_reserved: 0
        }
      });

      return {
        itemId: inventory.item_id,
        storeId: inventory.store_id,
        qtyOnHand: projectedOnHand,
        qtyReserved: inventory.qty_reserved,
        bin: inventory.bin ?? null,
        updatedAt: inventory.updated_at
      };
    });
  }
}
