import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorType } from '@shared-kernel/result/error';
import { AppErrorException } from '../exceptions/app-error.exception';

const ERROR_TYPE_TO_STATUS: Record<ErrorType, number> = {
  [ErrorType.Validation]: HttpStatus.BAD_REQUEST,
  [ErrorType.NotFound]: HttpStatus.NOT_FOUND,
  [ErrorType.Conflict]: HttpStatus.CONFLICT,
  [ErrorType.Unexpected]: HttpStatus.INTERNAL_SERVER_ERROR,
};

@Catch()
export class AppErrorFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    let status: number;
    let title: string;
    let detail: string;

    if (exception instanceof AppErrorException) {
      status = ERROR_TYPE_TO_STATUS[exception.appError.type];
      title = exception.appError.code;
      detail = exception.appError.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      title = exception.name;
      const response = exception.getResponse();
      const responseMessage = typeof response === 'string' ? response : (response as { message?: unknown }).message;
      detail = Array.isArray(responseMessage)
        ? responseMessage.join('; ')
        : (responseMessage ?? exception.message).toString();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      title = 'Unexpected error';
      detail = 'An unexpected error occurred.';
    }

    httpAdapter.reply(
      ctx.getResponse(),
      {
        type: 'about:blank',
        title,
        status,
        detail,
        instance: httpAdapter.getRequestUrl(request),
      },
      status,
    );
  }
}
