import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  orderId!: string;

  @IsString()
  method!: string;

  @IsOptional()
  @IsString()
  externalTxnId?: string;

  @IsInt()
  @Min(0)
  amountCents!: number;
}
