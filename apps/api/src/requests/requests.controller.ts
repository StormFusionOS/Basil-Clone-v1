import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

@ApiTags('requests')
@ApiBearerAuth()
@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  findAll() {
    return this.requestsService.findAll();
  }

  @Post()
  @Roles(Role.Admin, Role.Manager, Role.Clerk)
  create(@Body() payload: CreateRequestDto) {
    return this.requestsService.create(payload);
  }
}
