import { Test } from '@nestjs/testing';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

describe('ReportsController', () => {
  let controller: ReportsController;
  let service: ReportsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ReportsController],
      providers: [
        {
          provide: ReportsService,
          useValue: {
            salesSummary: jest.fn().mockReturnValue({ totalSalesCents: 100 })
          }
        }
      ]
    }).compile();

    controller = module.get(ReportsController);
    service = module.get(ReportsService);
  });

  it('returns sales summary', () => {
    expect(controller.salesSummary()).toEqual({ totalSalesCents: 100 });
    expect(service.salesSummary).toHaveBeenCalled();
  });
});
