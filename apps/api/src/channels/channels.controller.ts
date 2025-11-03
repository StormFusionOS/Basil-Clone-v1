import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { ChannelsService } from './channels.service';
import { UpdateChannelDto } from './dto/update-channel.dto';

@ApiTags('channels')
@ApiBearerAuth()
@Controller('channels')
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get()
  @Roles(Role.Admin, Role.Manager)
  findAll() {
    return this.channelsService.findAll();
  }

  @Put(':channelId')
  @Roles(Role.Admin, Role.Manager)
  update(
    @Param('channelId') channelId: string,
    @Body() payload: UpdateChannelDto
  ) {
    return this.channelsService.update(channelId, payload);
  }
}
