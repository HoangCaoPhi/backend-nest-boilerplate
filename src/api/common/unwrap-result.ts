import { Result } from '@shared-kernel/result/result';
import { AppErrorException } from './exceptions/app-error.exception';

export function unwrapResult<T>(result: Result<T>): T {
  if (result.isFailure) {
    throw new AppErrorException(result.getError());
  }
  return result.getValue();
}
