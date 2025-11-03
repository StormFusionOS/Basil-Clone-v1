import { Injectable } from '@nestjs/common';
import { PrintLabelDto } from './dto/print-label.dto';

@Injectable()
export class PrintingService {
  printLabels(payload: PrintLabelDto) {
    return {
      jobId: `${Date.now()}`,
      ...payload
    };
  }
}
