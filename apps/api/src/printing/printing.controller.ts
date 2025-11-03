import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PrintingService } from './printing.service';
import { PrintLabelDto } from './dto/print-label.dto';

@ApiTags('printing')
@ApiBearerAuth()
@Controller('printing')
export class PrintingController {
  constructor(private readonly printingService: PrintingService) {}

  @Post('labels')
  @Roles(Role.Admin, Role.Manager, Role.Clerk)
  printLabels(@Body() payload: PrintLabelDto) {
    return this.printingService.printLabels(payload);
  }
}
