import { Test } from '@nestjs/testing';
import { TitlesController } from './titles.controller';
import { TitlesService } from './titles.service';

const sampleTitle = {
  isbn13: '1234567890123',
  title: 'Sample Book',
  authors: ['Author One']
};

describe('TitlesController', () => {
  let controller: TitlesController;
  let service: TitlesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TitlesController],
      providers: [
        {
          provide: TitlesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([sampleTitle]),
            create: jest.fn().mockImplementation(async (payload) => payload),
            upsertFromEnrichment: jest.fn().mockResolvedValue(undefined)
          }
        }
      ]
    }).compile();

    controller = module.get(TitlesController);
    service = module.get(TitlesService);
  });

  it('returns all titles', async () => {
    await expect(controller.findAll()).resolves.toEqual([sampleTitle]);
  });

  it('creates a title', async () => {
    await expect(controller.create(sampleTitle as any)).resolves.toEqual(sampleTitle);
    expect(service.create).toHaveBeenCalledWith(sampleTitle);
  });

  it('upserts enrichment payload', async () => {
    await controller.upsertFromWorker({ ...sampleTitle, raw: {}, authors: ['Author One'] });
    expect(service.upsertFromEnrichment).toHaveBeenCalled();
  });
});
