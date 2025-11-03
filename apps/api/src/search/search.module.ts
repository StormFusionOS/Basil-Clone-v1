import { Module } from '@nestjs/common';
import { TitlesModule } from '../titles/titles.module';
import { SearchController } from './search.controller';

@Module({
  imports: [TitlesModule],
  controllers: [SearchController]
})
export class SearchModule {}
