import { AppError } from '@shared-kernel/result/error';

export class IdempotencyErrors {
  static duplicateRequest(requestId: string): AppError {
    return AppError.conflict('Idempotency.DuplicateRequest', `Request '${requestId}' was already processed.`);
  }

  static missingRequestId(): AppError {
    return AppError.validation('Idempotency.MissingRequestId', 'The Idempotency-Key header is required.');
  }
}
