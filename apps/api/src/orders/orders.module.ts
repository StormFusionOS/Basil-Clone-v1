import { Module } from '@nestjs/common';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [MonitoringModule, PrismaModule],
  providers: [OrdersService],
  controllers: [OrdersController]
})
export class OrdersModule {}
