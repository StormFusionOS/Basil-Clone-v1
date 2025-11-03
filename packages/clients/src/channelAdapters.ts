import type { ChannelFetchOrdersResult, ChannelPort, ChannelPortContext, ChannelPortResult } from '@bookforge/domain';

const sandboxMessage = 'sandbox mode: not active';

const successNoop = (): ChannelPortResult => ({ status: 'noop', message: sandboxMessage });

abstract class SandboxChannel implements ChannelPort {
  abstract readonly name: string;

  async upsertListing(ctx: ChannelPortContext): Promise<ChannelPortResult> {
    return { status: 'success', message: sandboxMessage, externalId: `${ctx.listingId}` };
  }

  async pauseListing(): Promise<ChannelPortResult> {
    return successNoop();
  }

  async deleteListing(): Promise<ChannelPortResult> {
    return successNoop();
  }

  async fetchOrders(): Promise<ChannelFetchOrdersResult> {
    return { orders: [] };
  }

  async acknowledgeOrder(): Promise<void> {
    return Promise.resolve();
  }
}

export class AmazonSpApiChannel extends SandboxChannel {
  readonly name = 'amazon-sp-api';
}

export class AbeBooksChannel extends SandboxChannel {
  readonly name = 'abebooks';
}

export class AlibrisChannel extends SandboxChannel {
  readonly name = 'alibris';
}

export class BiblioChannel extends SandboxChannel {
  readonly name = 'biblio';
}

export class ChrislandsChannel extends SandboxChannel {
  readonly name = 'chrislands';
}

export class BibliopolisChannel extends SandboxChannel {
  readonly name = 'bibliopolis';
}

export class BarnesNobleChannel extends SandboxChannel {
  readonly name = 'barnes-and-noble';
}

export const sandboxChannels: ChannelPort[] = [
  new AmazonSpApiChannel(),
  new AbeBooksChannel(),
  new AlibrisChannel(),
  new BiblioChannel(),
  new ChrislandsChannel(),
  new BibliopolisChannel(),
  new BarnesNobleChannel()
];
