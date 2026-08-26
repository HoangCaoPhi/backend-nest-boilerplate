import { AppError } from './error';

export class Result<T = void> {
  private constructor(
    private readonly successful: boolean,
    private readonly value: T | undefined,
    private readonly error: AppError | undefined,
  ) {}

  get isSuccess(): boolean {
    return this.successful;
  }

  get isFailure(): boolean {
    return !this.successful;
  }

  getValue(): T {
    if (this.isFailure) {
      throw new Error('Cannot get value of a failed result.');
    }
    return this.value as T;
  }

  getError(): AppError {
    if (this.isSuccess) {
      throw new Error('Cannot get error of a successful result.');
    }
    return this.error as AppError;
  }

  map<U>(project: (value: T) => U): Result<U> {
    return this.isFailure ? Result.fail<U>(this.error as AppError) : Result.ok(project(this.value as T));
  }

  static ok<T = void>(value?: T): Result<T> {
    return new Result<T>(true, value, undefined);
  }

  static fail<T = void>(error: AppError): Result<T> {
    return new Result<T>(false, undefined, error);
  }
}
