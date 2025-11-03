import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  findAll() {
    return this.paymentsService.findAll();
  }

  @Post()
  @Roles(Role.Admin, Role.Manager, Role.Clerk)
  record(@Body() payload: CreatePaymentDto) {
    return this.paymentsService.record(payload);
  }
}
