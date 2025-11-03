import { Test } from '@nestjs/testing';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';

const sampleRequest: CreateRequestDto = {
  customerId: 'customer-1',
  title: 'New Release'
};

describe('RequestsController', () => {
  let controller: RequestsController;
  let service: RequestsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [RequestsController],
      providers: [
        {
          provide: RequestsService,
          useValue: {
            findAll: jest.fn().mockReturnValue([sampleRequest]),
            create: jest.fn().mockImplementation((payload) => ({ id: '1', status: 'open', ...payload }))
          }
        }
      ]
    }).compile();

    controller = module.get(RequestsController);
    service = module.get(RequestsService);
  });

  it('lists requests', () => {
    expect(controller.findAll()).toEqual([sampleRequest]);
  });

  it('creates a request', () => {
    expect(controller.create(sampleRequest)).toEqual({ id: '1', status: 'open', ...sampleRequest });
    expect(service.create).toHaveBeenCalledWith(sampleRequest);
  });
});
