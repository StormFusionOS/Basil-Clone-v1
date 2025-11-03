import { IsArray, IsOptional, IsString, Length } from 'class-validator';

export class CreateTitleDto {
  @IsString()
  @Length(13, 13)
  isbn13!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsArray()
  @IsString({ each: true })
  authors!: string[];
}
