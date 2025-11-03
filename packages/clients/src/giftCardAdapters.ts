import type { GiftCardBalance, GiftCardContext, GiftCardPort, GiftCardResult } from '@bookforge/domain';

export class ValuTecSandboxAdapter implements GiftCardPort {
  readonly name = 'valuetec';

  async issue(amountCents: number, _context: GiftCardContext): Promise<GiftCardResult> {
    return {
      authorizationCode: `VT-${Date.now()}`,
      message: 'sandbox mode: not active'
    };
  }

  async balance(cardNumber: string): Promise<GiftCardBalance> {
    return {
      cardNumber,
      amountCents: 0
    };
  }

  async redeem(_cardNumber: string, _amountCents: number, _context: GiftCardContext): Promise<GiftCardResult> {
    return {
      authorizationCode: 'VT-NOOP',
      message: 'sandbox mode: not active'
    };
  }

  async void(): Promise<void> {
    return Promise.resolve();
  }
}

export const defaultGiftCardPorts: GiftCardPort[] = [new ValuTecSandboxAdapter()];
