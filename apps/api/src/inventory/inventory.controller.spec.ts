import { Test } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { RecordStockMovementDto } from './dto/record-stock-movement.dto';
import { Role } from '../common/enums/role.enum';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: InventoryService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        {
          provide: InventoryService,
          useValue: {
            getInventory: jest.fn().mockResolvedValue(['item']),
            update: jest.fn().mockImplementation(async (_id, payload: UpdateInventoryDto) => ({
              itemId: _id,
              storeId: payload.storeId,
              qtyOnHand: 10,
              qtyReserved: payload.qtyReserved,
              bin: payload.bin ?? null,
              updatedAt: new Date(payload.expectedUpdatedAt)
            })),
            recordMovement: jest
              .fn()
              .mockImplementation(async (_id, payload: RecordStockMovementDto) => ({
                itemId: _id,
                storeId: payload.storeId,
                qtyOnHand: 5,
                qtyReserved: 1,
                bin: null,
                updatedAt: new Date()
              }))
          }
        }
      ]
    }).compile();

    controller = module.get(InventoryController);
    service = module.get(InventoryService);
  });

  it('retrieves inventory for a store', async () => {
    await expect(controller.findForStore('store')).resolves.toEqual(['item']);
    expect(service.getInventory).toHaveBeenCalledWith('store');
  });

  it('updates inventory levels', async () => {
    const payload: UpdateInventoryDto = {
      storeId: 'store',
      qtyReserved: 1,
      expectedUpdatedAt: new Date().toISOString()
    };

    await expect(controller.update('item', payload)).resolves.toMatchObject({
      itemId: 'item',
      storeId: 'store',
      qtyReserved: 1
    });
    expect(service.update).toHaveBeenCalledWith('item', payload);
  });

  it('records stock movements with actor context', async () => {
    const payload: RecordStockMovementDto = {
      storeId: 'store',
      type: 'RECEIPT',
      quantity: 4
    };

    await expect(
      controller.recordMovement('item', payload, {
        user: { userId: 'user-1', role: Role.Manager }
      } as unknown as any)
    ).resolves.toMatchObject({ itemId: 'item', storeId: 'store' });

    expect(service.recordMovement).toHaveBeenCalledWith(
      'item',
      payload,
      expect.objectContaining({ userId: 'user-1', role: Role.Manager })
    );
  });
});
