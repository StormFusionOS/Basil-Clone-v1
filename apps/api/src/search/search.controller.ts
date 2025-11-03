import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TitlesService } from '../titles/titles.service';

@ApiTags('search')
@ApiBearerAuth()
@Controller()
export class SearchController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get('search')
  @ApiQuery({ name: 'q', required: true })
  async search(@Query('q') query: string) {
    return this.titlesService.search(query ?? '');
  }

  @Get('scan')
  @ApiQuery({ name: 'barcode', required: true })
  async scan(@Query('barcode') barcode: string) {
    return this.titlesService.scan(barcode ?? '');
  }
}
