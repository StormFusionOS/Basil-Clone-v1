import { Test } from '@nestjs/testing';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

const sampleCustomer: CreateCustomerDto = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  storeCreditCents: 0
};

const issuedCreditResponse = {
  issuanceId: 'issuance-1',
  customerId: 'cust-1',
  amountCents: 500,
  reason: 'Customer appeasement',
  balanceCents: 1500
};

describe('CustomersController', () => {
  let controller: CustomersController;
  let service: CustomersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CustomersController],
      providers: [
        {
          provide: CustomersService,
          useValue: {
            findAll: jest.fn().mockReturnValue([sampleCustomer]),
            create: jest
              .fn()
              .mockImplementation((payload) => ({ id: '1', loyalty_points: 0, ...payload })),
            issueStoreCredit: jest.fn().mockResolvedValue(issuedCreditResponse)
          }
        }
      ]
    }).compile();

    controller = module.get(CustomersController);
    service = module.get(CustomersService);
  });

  it('returns customers', () => {
    expect(controller.findAll()).toEqual([sampleCustomer]);
  });

  it('creates a customer', () => {
    expect(controller.create(sampleCustomer)).toEqual({ id: '1', loyalty_points: 0, ...sampleCustomer });
    expect(service.create).toHaveBeenCalledWith(sampleCustomer);
  });

  it('issues store credit', async () => {
    const payload = { amount_cents: 500, reason: 'Customer appeasement' };
    await expect(controller.issueStoreCredit('cust-1', payload)).resolves.toEqual(issuedCreditResponse);
    expect(service.issueStoreCredit).toHaveBeenCalledWith('cust-1', payload);
  });
});
