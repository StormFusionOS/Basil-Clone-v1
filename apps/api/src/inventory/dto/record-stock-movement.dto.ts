import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class RecordStockMovementDto {
  @IsString()
  storeId!: string;

  @IsString()
  type!: string;

  @IsInt()
  quantity!: number;

  @IsOptional()
  @IsBoolean()
  override?: boolean;

  @IsOptional()
  @IsString()
  refType?: string;

  @IsOptional()
  @IsString()
  refId?: string;
}
