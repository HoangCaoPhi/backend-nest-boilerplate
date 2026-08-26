import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Result } from '@shared-kernel/result/result';
import { AppErrorException } from './app-error.exception';

@Injectable()
export class ResultInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((value) => {
        if (!(value instanceof Result)) {
          return value;
        }
        if (value.isFailure) {
          throw new AppErrorException(value.getError());
        }
        return value.getValue();
      }),
    );
  }
}
