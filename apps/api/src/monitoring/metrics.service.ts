import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client';

type HttpLabels = {
  method: string;
  route: string;
  status_code: number;
};

type SyncFailureLabels = {
  service: string;
  reason: string;
};

@Injectable()
export class MetricsService {
  private readonly registry: Registry;
  private readonly httpDuration: Histogram<HttpLabels>;
  private readonly httpErrors: Counter<HttpLabels>;
  private readonly syncFailures: Counter<SyncFailureLabels>;

  constructor() {
    this.registry = new Registry();

    collectDefaultMetrics({ register: this.registry });

    this.httpDuration = new Histogram({
      name: 'http_server_requests_duration_seconds',
      help: 'Duration of HTTP server requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
      registers: [this.registry]
    });

    this.httpErrors = new Counter({
      name: 'http_server_request_errors_total',
      help: 'Total number of HTTP requests that resulted in an error response',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry]
    });

    this.syncFailures = new Counter({
      name: 'sync_failures_total',
      help: 'Total number of synchronization failures by service and reason',
      labelNames: ['service', 'reason'],
      registers: [this.registry]
    });
  }

  async scrape(): Promise<string> {
    return this.registry.metrics();
  }

  observeRequest(labels: HttpLabels, durationSeconds: number): void {
    this.httpDuration.observe(labels, durationSeconds);
  }

  incrementRequestError(labels: HttpLabels): void {
    this.httpErrors.inc(labels);
  }

  incrementSyncFailure(labels: SyncFailureLabels): void {
    this.syncFailures.inc(labels);
  }
}
