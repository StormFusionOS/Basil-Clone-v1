import { Test } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

const sampleOrder: CreateOrderDto = {
  id: '756e5eb8-712d-4f25-8d01-161f1c522f93',
  lines: [
    {
      itemId: 'item-1',
      title: 'Book',
      productId: '19c6e273-7fbb-46f9-8760-a9ede37d7436'
    }
  ]
};

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            findAll: jest.fn().mockReturnValue([sampleOrder]),
            create: jest.fn().mockImplementation((payload) => payload),
            applyStoreCredit: jest
              .fn()
              .mockResolvedValue({
                order: { id: sampleOrder.id, total_cents: 5000 },
                customer: { id: 'cust-1', store_credit_cents: 0 }
              })
          }
        }
      ]
    }).compile();

    controller = module.get(OrdersController);
    service = module.get(OrdersService);
  });

  it('returns orders', () => {
    expect(controller.getOrders()).toEqual([sampleOrder]);
  });

  it('creates an order', () => {
    expect(controller.createOrder(sampleOrder)).toEqual(sampleOrder);
    expect(service.create).toHaveBeenCalledWith(sampleOrder);
  });

  it('applies store credit', async () => {
    const payload = { amount_cents: 1000 };
    await expect(controller.applyStoreCredit(sampleOrder.id, payload)).resolves.toEqual({
      order: { id: sampleOrder.id, total_cents: 5000 },
      customer: { id: 'cust-1', store_credit_cents: 0 }
    });
    expect(service.applyStoreCredit).toHaveBeenCalledWith(sampleOrder.id, payload);
  });
});
