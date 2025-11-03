import { Injectable } from '@nestjs/common';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemsService {
  private readonly items: CreateItemDto[] = [];

  findAll(): CreateItemDto[] {
    return this.items;
  }

  create(payload: CreateItemDto): CreateItemDto {
    this.items.push(payload);
    return payload;
  }
}
