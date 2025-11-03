import { Test } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { TitlesService } from '../titles/titles.service';

describe('SearchController', () => {
  let controller: SearchController;
  let titlesService: TitlesService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: TitlesService,
          useValue: {
            search: jest.fn().mockResolvedValue([{ isbn13: '1', title: 'Test', authors: [], highlights: {} }]),
            scan: jest.fn().mockResolvedValue({ match: 'not_found' })
          }
        }
      ]
    }).compile();

    controller = moduleRef.get(SearchController);
    titlesService = moduleRef.get(TitlesService);
  });

  it('delegates search to titles service', async () => {
    const result = await controller.search('hobbit');
    expect(result).toEqual([{ isbn13: '1', title: 'Test', authors: [], highlights: {} }]);
    expect(titlesService.search).toHaveBeenCalledWith('hobbit');
  });

  it('delegates scan to titles service', async () => {
    const result = await controller.scan('9780000000000');
    expect(result).toEqual({ match: 'not_found' });
    expect(titlesService.scan).toHaveBeenCalledWith('9780000000000');
  });
});
