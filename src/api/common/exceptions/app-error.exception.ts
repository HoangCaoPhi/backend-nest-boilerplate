import { AppError } from '@shared-kernel/result/error';

export class AppErrorException extends Error {
  constructor(readonly appError: AppError) {
    super(appError.message);
  }
}
