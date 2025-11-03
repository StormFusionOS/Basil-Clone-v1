import { Injectable } from '@nestjs/common';
import { CreateRequestDto } from './dto/create-request.dto';

interface RequestRecord extends CreateRequestDto {
  id: string;
  status: 'open' | 'closed';
}

@Injectable()
export class RequestsService {
  private readonly requests: RequestRecord[] = [];

  create(payload: CreateRequestDto): RequestRecord {
    const record: RequestRecord = {
      id: `${Date.now()}`,
      status: 'open',
      ...payload
    };
    this.requests.push(record);
    return record;
  }

  findAll(): RequestRecord[] {
    return this.requests;
  }
}
