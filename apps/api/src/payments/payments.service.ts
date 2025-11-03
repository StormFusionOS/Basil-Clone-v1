import { Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface PaymentRecord extends CreatePaymentDto {
  id: string;
  status: 'authorized' | 'captured' | 'failed';
}

@Injectable()
export class PaymentsService {
  private readonly payments: PaymentRecord[] = [];

  record(payload: CreatePaymentDto): PaymentRecord {
    const record: PaymentRecord = {
      id: `${Date.now()}`,
      status: 'captured',
      ...payload
    };
    this.payments.push(record);
    return record;
  }

  findAll(): PaymentRecord[] {
    return this.payments;
  }
}
