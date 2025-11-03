import { Test } from '@nestjs/testing';
import { PrintingController } from './printing.controller';
import { PrintingService } from './printing.service';
import { PrintLabelDto } from './dto/print-label.dto';

const sampleRequest: PrintLabelDto = {
  itemIds: ['item-1'],
  template: 'default'
};

describe('PrintingController', () => {
  let controller: PrintingController;
  let service: PrintingService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [PrintingController],
      providers: [
        {
          provide: PrintingService,
          useValue: {
            printLabels: jest.fn().mockImplementation((payload) => ({ jobId: '1', ...payload }))
          }
        }
      ]
    }).compile();

    controller = module.get(PrintingController);
    service = module.get(PrintingService);
  });

  it('prints labels', () => {
    expect(controller.printLabels(sampleRequest)).toEqual({ jobId: '1', ...sampleRequest });
    expect(service.printLabels).toHaveBeenCalledWith(sampleRequest);
  });
});
