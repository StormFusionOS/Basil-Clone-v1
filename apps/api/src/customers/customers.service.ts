import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { IssueStoreCreditDto } from './dto/issue-store-credit.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  create(payload: CreateCustomerDto) {
    return this.prisma.customers.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone ?? null,
        marketing_opt_in: false,
        store_credit_cents: payload.storeCreditCents ?? 0,
        loyalty_points: 0
      }
    });
  }

  findAll() {
    return this.prisma.customers.findMany();
  }

  async issueStoreCredit(customerId: string, payload: IssueStoreCreditDto, actor?: { userId?: string }) {
    if (payload.amount_cents <= 0) {
      throw new BadRequestException('amount_cents must be greater than zero');
    }

    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customers.findUnique({
        where: { id: customerId }
      });

      if (!customer) {
        throw new NotFoundException('Customer not found');
      }

      const [updatedCustomer, issuance] = await Promise.all([
        tx.customers.update({
          where: { id: customerId },
          data: { store_credit_cents: { increment: payload.amount_cents } }
        }),
        tx.store_credit_issuances.create({
          data: {
            customer_id: customerId,
            amount_cents: payload.amount_cents,
            reason: payload.reason,
            issued_by: actor?.userId ?? null
          }
        })
      ]);

      return {
        issuanceId: issuance.id,
        customerId: updatedCustomer.id,
        amountCents: payload.amount_cents,
        reason: payload.reason,
        balanceCents: updatedCustomer.store_credit_cents
      };
    });
  }
}
