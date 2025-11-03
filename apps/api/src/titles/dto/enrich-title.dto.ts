import { IsArray, IsDateString, IsObject, IsOptional, IsString, Length } from 'class-validator';

export class UpsertTitleEnrichmentDto {
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

  @IsOptional()
  @IsString()
  publisher?: string;

  @IsOptional()
  @IsDateString()
  publishedAt?: string;

  @IsObject()
  raw!: Record<string, unknown>;
}
