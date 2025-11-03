import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('returns ok status', () => {
    const controller = new HealthController();
    const result = controller.check();
    expect(result.status).toBe('ok');
    expect(typeof result.uptime).toBe('number');
  });
});
