export enum ErrorType {
  Validation = 'Validation',
  NotFound = 'NotFound',
  Conflict = 'Conflict',
  Unexpected = 'Unexpected',
}

export class AppError {
  private constructor(
    readonly type: ErrorType,
    readonly code: string,
    readonly message: string,
  ) {}

  static validation(code: string, message: string): AppError {
    return new AppError(ErrorType.Validation, code, message);
  }

  static notFound(code: string, message: string): AppError {
    return new AppError(ErrorType.NotFound, code, message);
  }

  static conflict(code: string, message: string): AppError {
    return new AppError(ErrorType.Conflict, code, message);
  }

  static unexpected(code: string, message: string): AppError {
    return new AppError(ErrorType.Unexpected, code, message);
  }
}
