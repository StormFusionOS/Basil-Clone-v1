import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@ApiTags('purchase-orders')
@ApiBearerAuth()
@Controller('purchase-orders')
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  findAll() {
    return this.purchaseService.findAll();
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  create(@Body() payload: CreatePurchaseOrderDto) {
    return this.purchaseService.create(payload);
  }
}
