import { Test } from '@nestjs/testing';
import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

const samplePurchaseOrder: CreatePurchaseOrderDto = {
  vendorId: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
  storeId: 'store_downtown',
  lines: [
    {
      isbn13: '1234567890123',
      quantity: 5
    }
  ]
};

describe('PurchaseController', () => {
  let controller: PurchaseController;
  let service: PurchaseService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PurchaseController],
      providers: [
        {
          provide: PurchaseService,
          useValue: {
            findAll: jest.fn().mockReturnValue([samplePurchaseOrder]),
            create: jest.fn().mockImplementation((payload) => ({ id: '1', status: 'open', ...payload }))
          }
        }
      ]
    }).compile();

    controller = module.get(PurchaseController);
    service = module.get(PurchaseService);
  });

  it('returns purchase orders', () => {
    expect(controller.findAll()).toEqual([samplePurchaseOrder]);
  });

  it('creates a purchase order', () => {
    expect(controller.create(samplePurchaseOrder)).toEqual({ id: '1', status: 'open', ...samplePurchaseOrder });
    expect(service.create).toHaveBeenCalledWith(samplePurchaseOrder);
  });
});
