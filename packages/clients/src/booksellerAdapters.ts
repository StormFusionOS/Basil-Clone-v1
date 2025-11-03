import type { BooksellerInventoryPayload, BooksellerPort, BooksellerResult } from '@bookforge/domain';

abstract class SandboxBookseller implements BooksellerPort {
  abstract readonly name: string;

  async pushInventorySnapshot(_payload: BooksellerInventoryPayload): Promise<BooksellerResult> {
    return { status: 'noop', message: 'sandbox mode: not active' };
  }

  async exportAudience(): Promise<BooksellerResult> {
    return { status: 'noop', message: 'sandbox mode: not active' };
  }

  async submitEdi(): Promise<BooksellerResult> {
    return { status: 'noop', message: 'sandbox mode: not active' };
  }
}

export class EdelweissBooksellerAdapter extends SandboxBookseller {
  readonly name = 'edelweiss';
}

export class IndieCommerceBooksellerAdapter extends SandboxBookseller {
  readonly name = 'indiecommerce';
}

export class PubnetBooksellerAdapter extends SandboxBookseller {
  readonly name = 'pubnet';
}

export const sandboxBooksellerAdapters: BooksellerPort[] = [
  new EdelweissBooksellerAdapter(),
  new IndieCommerceBooksellerAdapter(),
  new PubnetBooksellerAdapter()
];
