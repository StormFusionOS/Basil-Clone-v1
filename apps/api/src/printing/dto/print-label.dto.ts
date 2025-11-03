import { IsArray, IsString } from 'class-validator';

export class PrintLabelDto {
  @IsArray()
  @IsString({ each: true })
  itemIds!: string[];

  @IsString()
  template!: string;
}
