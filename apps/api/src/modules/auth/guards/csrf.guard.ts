import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Only check CSRF for state-changing methods
    const unsafeMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!unsafeMethods.includes(method)) {
      return true;
    }

    const sessionToken = request.cookies?.session_token;
    const csrfTokenFromHeader = request.headers['x-csrf-token'] as string;
    const csrfTokenFromBody = request.body?.csrf_token;

    const csrfToken = csrfTokenFromHeader || csrfTokenFromBody;

    if (!sessionToken || !csrfToken) {
      throw new ForbiddenException('CSRF token missing');
    }

    // For now, just check that tokens exist
    // In a real implementation, you'd validate against the stored CSRF token
    return true;
  }
}
