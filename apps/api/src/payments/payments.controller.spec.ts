import { Test } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

const samplePayment: CreatePaymentDto = {
  orderId: '497f6eca-6276-4993-bfeb-53cbbbba6f08',
  method: 'card',
  amountCents: 1000
};

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            findAll: jest.fn().mockReturnValue([samplePayment]),
            record: jest.fn().mockImplementation((payload) => ({ id: '1', status: 'captured', ...payload }))
          }
        }
      ]
    }).compile();

    controller = module.get(PaymentsController);
    service = module.get(PaymentsService);
  });

  it('lists payments', () => {
    expect(controller.findAll()).toEqual([samplePayment]);
  });

  it('records a payment', () => {
    expect(controller.record(samplePayment)).toEqual({ id: '1', status: 'captured', ...samplePayment });
    expect(service.record).toHaveBeenCalledWith(samplePayment);
  });
});
