import type { PaymentContext, PaymentPort, PaymentResult } from '@bookforge/domain';

const simulatorDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export class SquareTerminalSimulator implements PaymentPort {
  readonly name = 'square-terminal';

  constructor(private readonly mode: 'SIMULATOR' | 'LIVE' = 'SIMULATOR') {}

  async present(amountCents: number, context: PaymentContext): Promise<PaymentResult> {
    if (this.mode !== 'SIMULATOR') {
      throw new Error('SquareTerminalSimulator configured for LIVE mode without credentials');
    }
    await simulatorDelay(300);
    return {
      status: 'approved',
      transactionId: `sq_${context.orderId}`,
      approvalCode: 'SIM-APPROVED'
    };
  }

  async cancel(): Promise<void> {
    return Promise.resolve();
  }

  async refund(transactionId: string, amountCents: number): Promise<PaymentResult> {
    await simulatorDelay(150);
    return {
      status: 'approved',
      transactionId: `${transactionId}_refund`,
      approvalCode: 'SIM-REFUND'
    };
  }
}

export class CayanStub implements PaymentPort {
  readonly name = 'cayan';

  async present(): Promise<PaymentResult> {
    return {
      status: 'pending',
      message: 'sandbox mode: not active'
    };
  }

  async cancel(): Promise<void> {
    return Promise.resolve();
  }

  async refund(): Promise<PaymentResult> {
    return {
      status: 'pending',
      message: 'sandbox mode: not active'
    };
  }
}

export const defaultPaymentPorts: PaymentPort[] = [
  new SquareTerminalSimulator(),
  new CayanStub()
];
