import { Test } from '@nestjs/testing';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { UpdateChannelDto } from './dto/update-channel.dto';

const sampleChannel: UpdateChannelDto = {
  id: 'amazon',
  name: 'Amazon',
  enabled: true
};

describe('ChannelsController', () => {
  let controller: ChannelsController;
  let service: ChannelsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ChannelsController],
      providers: [
        {
          provide: ChannelsService,
          useValue: {
            findAll: jest.fn().mockReturnValue([sampleChannel]),
            update: jest.fn().mockImplementation((_id, payload) => payload)
          }
        }
      ]
    }).compile();

    controller = module.get(ChannelsController);
    service = module.get(ChannelsService);
  });

  it('returns channels', () => {
    expect(controller.findAll()).toEqual([sampleChannel]);
  });

  it('updates channel', () => {
    expect(controller.update('amazon', sampleChannel)).toEqual(sampleChannel);
    expect(service.update).toHaveBeenCalledWith('amazon', sampleChannel);
  });
});
