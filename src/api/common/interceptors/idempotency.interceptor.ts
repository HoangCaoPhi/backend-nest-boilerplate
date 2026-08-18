import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
import { IdempotencyErrors } from '@application/common/idempotency/idempotency.errors';
import { RequestManager } from '@application/common/idempotency/request-manager.interface';
import { REQUEST_MANAGER } from '@application/common/idempotency/idempotency.di-tokens';
import { AppErrorException } from '../exceptions/app-error.exception';

const IDEMPOTENCY_HEADER = 'idempotency-key';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    @Inject(REQUEST_MANAGER)
    private readonly requestManager: RequestManager,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    // A repeated header arrives as an array; only a single value is a usable key.
    const header = request.headers[IDEMPOTENCY_HEADER];
    const requestId = typeof header === 'string' ? header.trim() : '';

    if (!requestId) {
      throw new AppErrorException(IdempotencyErrors.missingRequestId());
    }

    const handlerName = `${context.getClass().name}.${context.getHandler().name}`;
    if (!(await this.requestManager.register(requestId, handlerName))) {
      throw new AppErrorException(IdempotencyErrors.duplicateRequest(requestId));
    }

    return next.handle().pipe(
      catchError((error: unknown) => {
        // The work did not complete, so the key must not stay burned — otherwise a
        // transient failure would lock the caller out of ever retrying it.
        void this.requestManager.release(requestId);
        return throwError(() => error);
      }),
    );
  }
}
