import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MetricsService } from '../monitoring/metrics.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApplyStoreCreditDto } from './dto/apply-store-credit.dto';

const mockOrders: CreateOrderDto[] = [];

@Injectable()
export class OrdersService {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly prisma: PrismaService
  ) {}

  findAll() {
    return mockOrders;
  }

  async create(order: CreateOrderDto) {
    try {
      mockOrders.push(order);
      return order;
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'UnknownError';
      this.metricsService.incrementSyncFailure({ service: 'orders', reason });
      throw error;
    }
  }

  async applyStoreCredit(orderId: string, payload: ApplyStoreCreditDto, actor?: { userId?: string }) {
    if (payload.amount_cents <= 0) {
      throw new BadRequestException('amount_cents must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.orders.findUnique({
        where: { id: orderId },
        include: { customer: true }
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (!order.customer_id || !order.customer) {
        throw new BadRequestException('Order has no associated customer');
      }

      if (payload.amount_cents > order.total_cents) {
        throw new BadRequestException('Cannot apply more credit than order total');
      }

      const customer = order.customer;
      const currentStoreCredit = customer.store_credit_cents;
      const loyaltyBlocksAvailable = Math.floor(customer.loyalty_points / 100);
      const convertibleFromLoyalty = loyaltyBlocksAvailable * 500;
      const totalAvailable = currentStoreCredit + convertibleFromLoyalty;

      if (payload.amount_cents > totalAvailable) {
        throw new BadRequestException('Insufficient store credit and loyalty points');
      }

      let pointsRedeemed = 0;
      let effectiveStoreCredit = currentStoreCredit;

      if (payload.amount_cents > effectiveStoreCredit) {
        const shortfall = payload.amount_cents - effectiveStoreCredit;
        const blocksNeeded = Math.ceil(shortfall / 500);
        const blocksUsed = Math.min(blocksNeeded, loyaltyBlocksAvailable);
        pointsRedeemed = blocksUsed * 100;
        effectiveStoreCredit += blocksUsed * 500;
      }

      const loyaltyCentsConverted = (pointsRedeemed / 100) * 500;
      const remainingStoreCredit = effectiveStoreCredit - payload.amount_cents;

      const updatedDiscount = order.discount_cents + payload.amount_cents;
      const updatedTotal = Math.max(0, order.total_cents - payload.amount_cents);
      const updatedApplied = order.store_credit_applied_cents + payload.amount_cents;
      const newAwardedPoints = Math.floor(updatedTotal / 100);
      const loyaltyAwardDelta = newAwardedPoints - order.loyalty_points_awarded;
      const updatedLoyaltyBalance = customer.loyalty_points - pointsRedeemed + loyaltyAwardDelta;

      if (updatedLoyaltyBalance < 0) {
        throw new BadRequestException('Loyalty points would become negative');
      }

      const [updatedCustomer, updatedOrder, redemption] = await Promise.all([
        tx.customers.update({
          where: { id: customer.id },
          data: {
            store_credit_cents: remainingStoreCredit,
            loyalty_points: updatedLoyaltyBalance
          }
        }),
        tx.orders.update({
          where: { id: orderId },
          data: {
            discount_cents: updatedDiscount,
            total_cents: updatedTotal,
            store_credit_applied_cents: updatedApplied,
            loyalty_points_awarded: newAwardedPoints
          }
        }),
        tx.store_credit_redemptions.create({
          data: {
            customer_id: customer.id,
            order_id: orderId,
            amount_cents: payload.amount_cents,
            loyalty_points_used: pointsRedeemed,
            redeemed_by: actor?.userId ?? null
          }
        })
      ]);

      return {
        order: updatedOrder,
        customer: updatedCustomer,
        redemptionId: redemption.id,
        loyaltyPointsRedeemed: pointsRedeemed,
        loyaltyPointsAwarded: newAwardedPoints,
        loyaltyPointsDelta: loyaltyAwardDelta,
        loyaltyCentsConverted,
        remainingStoreCredit
      };
    });
  }
}
