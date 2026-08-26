import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { STATUS_CODES } from 'node:http';
import { ClsService } from 'nestjs-cls';
import { ErrorType } from '@shared-kernel/result/error';
import { AppErrorException } from './app-error.exception';

const ERROR_TYPE_TO_STATUS: Record<ErrorType, number> = {
  [ErrorType.Validation]: HttpStatus.BAD_REQUEST,
  [ErrorType.NotFound]: HttpStatus.NOT_FOUND,
  [ErrorType.Conflict]: HttpStatus.CONFLICT,
  [ErrorType.Unexpected]: HttpStatus.INTERNAL_SERVER_ERROR,
};

const PROBLEM_JSON = 'application/problem+json';

interface Failure {
  status: number;
  detail: string;
  code?: string;
}

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppErrorFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly cls: ClsService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const failure = this.toFailure(exception);
    const requestId = this.requestId();

    if (failure.status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Unhandled failure on request ${requestId ?? 'unknown'}`, exception as Error);
    }

    httpAdapter.setHeader(response, 'Content-Type', PROBLEM_JSON);
    httpAdapter.reply(
      response,
      {
        title: STATUS_CODES[failure.status] ?? 'Error',
        status: failure.status,
        detail: failure.detail,
        instance: httpAdapter.getRequestUrl(ctx.getRequest()),
        ...(failure.code ? { code: failure.code } : {}),
        ...(requestId ? { requestId } : {}),
      },
      failure.status,
    );
  }

  private requestId(): string | undefined {
    return this.cls.isActive() ? this.cls.getId() : undefined;
  }

  private toFailure(exception: unknown): Failure {
    if (exception instanceof AppErrorException) {
      return {
        status: ERROR_TYPE_TO_STATUS[exception.appError.type],
        detail: exception.appError.message,
        code: exception.appError.code,
      };
    }

    if (exception instanceof HttpException) {
      return { status: exception.getStatus(), detail: detailOf(exception) };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, detail: 'An unexpected error occurred.' };
  }
}

function detailOf(exception: HttpException): string {
  const response = exception.getResponse();
  if (typeof response === 'string') {
    return response;
  }

  const message = (response as { message?: unknown }).message;
  if (Array.isArray(message)) {
    return message.join('; ');
  }

  return (message ?? exception.message).toString();
}
