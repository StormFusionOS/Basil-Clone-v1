import type { ShippingLabelRequest, ShippingLabelResult, ShippingPort, ShippingRateRequest, ShippingRateResult } from '@bookforge/domain';

const noopRateResult: ShippingRateResult = { rates: [] };

abstract class SandboxShipping implements ShippingPort {
  abstract readonly name: string;

  async createLabel(request: ShippingLabelRequest): Promise<ShippingLabelResult> {
    return {
      labelId: `${this.name}-${Date.now()}`,
      trackingNumber: `TRACK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      costCents: 0,
      labelUrl: 'about:blank',
      documents: {
        pdf: 'sandbox mode: not active'
      }
    };
  }

  async voidLabel(): Promise<void> {
    return Promise.resolve();
  }

  async rateShop(): Promise<ShippingRateResult> {
    return noopRateResult;
  }
}

export class DazzleShippingAdapter extends SandboxShipping {
  readonly name = 'dazzle';
}

export class DesktopShipperAdapter extends SandboxShipping {
  readonly name = 'desktopshipper';
}

export class IbsShippingAdapter extends SandboxShipping {
  readonly name = 'ibs';
}

export const sandboxShippingAdapters: ShippingPort[] = [
  new DazzleShippingAdapter(),
  new DesktopShipperAdapter(),
  new IbsShippingAdapter()
];
