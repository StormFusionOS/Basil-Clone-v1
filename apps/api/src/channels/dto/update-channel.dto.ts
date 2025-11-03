import { IsBoolean, IsString } from 'class-validator';

export class UpdateChannelDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsBoolean()
  enabled!: boolean;
}
