import { Injectable } from '@nestjs/common';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

interface PurchaseOrderRecord extends CreatePurchaseOrderDto {
  id: string;
  status: 'open' | 'received';
}

@Injectable()
export class PurchaseService {
  private readonly purchaseOrders: PurchaseOrderRecord[] = [];

  create(payload: CreatePurchaseOrderDto): PurchaseOrderRecord {
    const record: PurchaseOrderRecord = {
      id: `${Date.now()}`,
      status: 'open',
      ...payload
    };
    this.purchaseOrders.push(record);
    return record;
  }

  findAll(): PurchaseOrderRecord[] {
    return this.purchaseOrders;
  }
}
