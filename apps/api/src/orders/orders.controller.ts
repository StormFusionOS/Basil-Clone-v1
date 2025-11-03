import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { ApplyStoreCreditDto } from './dto/apply-store-credit.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  getOrders() {
    return this.orders.findAll();
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  createOrder(@Body() payload: CreateOrderDto) {
    return this.orders.create(payload);
  }

  @Post(':id/apply-store-credit')
  @Roles(Role.Admin, Role.Manager, Role.Clerk)
  applyStoreCredit(@Param('id') orderId: string, @Body() payload: ApplyStoreCreditDto) {
    return this.orders.applyStoreCredit(orderId, payload);
  }
}
