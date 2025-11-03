import { IsBoolean, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateItemDto {
  @IsUUID()
  id!: string;

  @IsString()
  @Length(13, 13)
  isbn13!: string;

  @IsString()
  condition!: string;

  @IsOptional()
  @IsBoolean()
  signed?: boolean;
}
