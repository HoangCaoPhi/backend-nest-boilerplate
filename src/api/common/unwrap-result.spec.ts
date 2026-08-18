import { AppError, ErrorType } from '@shared-kernel/result/error';
import { Result } from '@shared-kernel/result/result';
import { AppErrorException } from './exceptions/app-error.exception';
import { unwrapResult } from './unwrap-result';

describe('unwrapResult', () => {
  it('returns the value of a successful result', () => {
    expect(unwrapResult(Result.ok('id-1'))).toBe('id-1');
  });

  it('throws an AppErrorException carrying the original error', () => {
    const error = AppError.notFound('TodoList.NotFound', 'missing');

    try {
      unwrapResult(Result.fail(error));
      fail('expected unwrapResult to throw');
    } catch (thrown) {
      expect(thrown).toBeInstanceOf(AppErrorException);
      expect((thrown as AppErrorException).appError).toBe(error);
      expect((thrown as AppErrorException).appError.type).toBe(ErrorType.NotFound);
    }
  });
});
