import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsInt()
  @Min(0)
  storeCreditCents!: number;
}
