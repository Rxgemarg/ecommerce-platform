import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus;
    let message: string | object;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        message = (exceptionResponse as any).message || exceptionResponse;
      } else {
        message = 'Error';
      }

      stack = exception.stack;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      stack = (exception as Error)?.stack;

      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception
      );
    }

    // Log the error
    this.logger.error(`${request.method} ${request.url} ${status}`, {
      message,
      userId: (request as any).user?.id,
      ip: request.ip,
      userAgent: request.get('user-agent'),
    });

    // Don't expose stack trace in production
    const isDevelopment = process.env.NODE_ENV === 'development';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(isDevelopment && { stack }),
    });
  }
}
