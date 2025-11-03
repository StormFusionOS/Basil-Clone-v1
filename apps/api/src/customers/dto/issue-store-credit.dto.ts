import { IsInt, IsString, Min } from 'class-validator';

export class IssueStoreCreditDto {
  @IsInt()
  @Min(1)
  amount_cents!: number;

  @IsString()
  reason!: string;
}
