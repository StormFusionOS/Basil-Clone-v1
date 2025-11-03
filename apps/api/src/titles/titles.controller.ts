import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { TitlesService } from './titles.service';
import { CreateTitleDto } from './dto/create-title.dto';
import { Public } from '../common/decorators/public.decorator';
import { UpsertTitleEnrichmentDto } from './dto/enrich-title.dto';

@ApiTags('titles')
@ApiBearerAuth()
@Controller('titles')
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get()
  findAll() {
    return this.titlesService.findAll();
  }

  @Post()
  @Roles(Role.Admin, Role.Manager)
  create(@Body() payload: CreateTitleDto) {
    return this.titlesService.create(payload);
  }

  @Post('enrichment')
  @Public()
  async upsertFromWorker(@Body() payload: UpsertTitleEnrichmentDto) {
    await this.titlesService.upsertFromEnrichment(payload);
    return { status: 'ok' };
  }
}
