import { Test } from '@nestjs/testing';
import { ItemsController } from './items.controller';
import { ItemsService } from './items.service';

const sampleItem = {
  id: 'c7dd2d98-60fc-4f0a-9d1b-7e7b93f9f0b3',
  isbn13: '1234567890123',
  condition: 'new'
};

describe('ItemsController', () => {
  let controller: ItemsController;
  let service: ItemsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: ItemsService,
          useValue: {
            findAll: jest.fn().mockReturnValue([sampleItem]),
            create: jest.fn().mockImplementation((payload) => payload)
          }
        }
      ]
    }).compile();

    controller = module.get(ItemsController);
    service = module.get(ItemsService);
  });

  it('lists items', () => {
    expect(controller.findAll()).toEqual([sampleItem]);
  });

  it('creates an item', () => {
    expect(controller.create(sampleItem)).toEqual(sampleItem);
    expect(service.create).toHaveBeenCalledWith(sampleItem);
  });
});
