import { IsInt, IsISO8601, IsOptional, IsString } from 'class-validator';

export class UpdateInventoryDto {
  @IsString()
  storeId!: string;

  @IsInt()
  qtyReserved!: number;

  @IsOptional()
  @IsString()
  bin?: string;

  @IsISO8601()
  expectedUpdatedAt!: string;
}
