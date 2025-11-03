import { Injectable } from '@nestjs/common';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  private readonly channels: UpdateChannelDto[] = [
    { id: 'amazon', name: 'Amazon', enabled: false },
    { id: 'abebooks', name: 'AbeBooks', enabled: false }
  ];

  findAll() {
    return this.channels;
  }

  update(channelId: string, payload: UpdateChannelDto) {
    const index = this.channels.findIndex((channel) => channel.id === channelId);

    if (index >= 0) {
      this.channels[index] = payload;
      return this.channels[index];
    }

    this.channels.push(payload);
    return payload;
  }
}
