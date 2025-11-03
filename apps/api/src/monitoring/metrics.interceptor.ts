import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, tap, throwError } from 'rxjs';
import type { Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const method = request?.method ?? 'UNKNOWN';
    const route = request?.route?.path ?? request?.url ?? 'unknown';
    const start = process.hrtime.bigint();

    const observe = (statusCode: number) => {
      const duration = Number(process.hrtime.bigint() - start) / 1_000_000_000;
      this.metricsService.observeRequest({ method, route, status_code: statusCode }, duration);
    };

    return next.handle().pipe(
      tap(() => {
        observe(response?.statusCode ?? 200);
      }),
      catchError((error) => {
        const statusCode = (error?.status as number | undefined) ?? response?.statusCode ?? 500;
        observe(statusCode);
        this.metricsService.incrementRequestError({ method, route, status_code: statusCode });
        return throwError(() => error);
      })
    );
  }
}
