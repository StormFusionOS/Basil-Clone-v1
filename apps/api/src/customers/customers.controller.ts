import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { IssueStoreCreditDto } from './dto/issue-store-credit.dto';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  findAll() {
    return this.customersService.findAll();
  }

  @Post()
  @Roles(Role.Admin, Role.Manager, Role.Clerk)
  create(@Body() payload: CreateCustomerDto) {
    return this.customersService.create(payload);
  }

  @Post(':id/store-credit/issue')
  @Roles(Role.Admin, Role.Manager)
  issueStoreCredit(@Param('id') customerId: string, @Body() payload: IssueStoreCreditDto) {
    return this.customersService.issueStoreCredit(customerId, payload);
  }
}
