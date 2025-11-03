import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TitlesModule } from './titles/titles.module';
import { ItemsModule } from './items/items.module';
import { InventoryModule } from './inventory/inventory.module';
import { PaymentsModule } from './payments/payments.module';
import { CustomersModule } from './customers/customers.module';
import { PurchaseModule } from './purchase/purchase.module';
import { ChannelsModule } from './channels/channels.module';
import { RequestsModule } from './requests/requests.module';
import { PrintingModule } from './printing/printing.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    OrdersModule,
    MonitoringModule,
    PrismaModule,
    AuthModule,
    TitlesModule,
    ItemsModule,
    InventoryModule,
    PaymentsModule,
    CustomersModule,
    PurchaseModule,
    ChannelsModule,
    RequestsModule,
    PrintingModule,
    ReportsModule,
    SearchModule
  ]
})
export class AppModule {}
