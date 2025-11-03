import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';

class OrderLineDto {
  @IsString()
  itemId!: string;

  @IsString()
  title!: string;

  @IsUUID()
  productId!: string;
}

export class CreateOrderDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  @IsUUID()
  customerId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines!: OrderLineDto[];
}
