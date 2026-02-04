import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const now = Date.now();
    const userId = request.user?.id;

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const contentLength = response.get('content-length');
        const delay = Date.now() - now;

        const message = `${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${delay}ms`;

        if (statusCode >= 400) {
          this.logger.warn(message, { userId });
        } else {
          this.logger.log(message, { userId });
        }
      })
    );
  }
}
