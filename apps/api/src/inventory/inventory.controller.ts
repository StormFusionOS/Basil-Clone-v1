import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { RecordStockMovementDto } from './dto/record-stock-movement.dto';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get(':storeId')
  findForStore(@Param('storeId') storeId: string) {
    return this.inventoryService.getInventory(storeId);
  }

  @Patch(':itemId')
  @Roles(Role.Admin, Role.Manager)
  update(
    @Param('itemId') itemId: string,
    @Body() payload: UpdateInventoryDto
  ) {
    return this.inventoryService.update(itemId, payload);
  }

  @Post(':itemId/movements')
  @Roles(Role.Admin, Role.Manager, Role.Clerk)
  recordMovement(
    @Param('itemId') itemId: string,
    @Body() payload: RecordStockMovementDto,
    @Req() request: Request
  ) {
    const user = request.user as { userId?: string; role?: Role } | undefined;

    return this.inventoryService.recordMovement(itemId, payload, {
      userId: user?.userId,
      role: (user?.role as Role) ?? Role.Clerk
    });
  }
}
