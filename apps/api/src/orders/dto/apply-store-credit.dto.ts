import { IsInt, Min } from 'class-validator';

export class ApplyStoreCreditDto {
  @IsInt()
  @Min(1)
  amount_cents!: number;
}
