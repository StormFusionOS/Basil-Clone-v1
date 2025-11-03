import { IsOptional, IsString } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsString()
  isbn13?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  author?: string;
}
