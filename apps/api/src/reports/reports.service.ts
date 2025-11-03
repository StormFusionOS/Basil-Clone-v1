import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsService {
  salesSummary() {
    return {
      period: 'last_7_days',
      totalSalesCents: 1250000,
      averageOrderValueCents: 2500
    };
  }
}
