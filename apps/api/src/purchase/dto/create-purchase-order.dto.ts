import { IsArray, IsInt, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class PurchaseOrderLineDto {
  @IsString()
  isbn13!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreatePurchaseOrderDto {
  @IsUUID()
  vendorId!: string;

  @IsString()
  storeId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines!: PurchaseOrderLineDto[];
}
