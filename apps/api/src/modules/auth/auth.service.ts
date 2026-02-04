import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService
  ) {}

  async register(userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) {
    const { email, password, first_name, last_name } = userData;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const password_hash = await argon2.hash(password);

    // Create user
    const user = await this.usersService.create({
      email: email.toLowerCase(),
      password_hash,
      first_name,
      last_name,
    });

    this.logger.log(`New user registered: ${user.email}`);

    // Create audit log
    await this.auditService.log({
      actor_user_id: user.id,
      action: 'CREATE',
      entity: 'users',
      entity_id: user.id,
      new_values: { email: user.email, first_name, last_name },
    });

    // Generate session
    const session = await this.createSession(user.id);

    return {
      user: this.sanitizeUser(user),
      session_token: session.session_token,
      csrf_token: session.csrf_token,
    };
  }

  async login(
    email: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.password_hash, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Create audit log
    await this.auditService.log({
      actor_user_id: user.id,
      action: 'LOGIN',
      entity: 'users',
      entity_id: user.id,
      ip_address: ipAddress,
      user_agent: userAgent,
    });

    // Create session
    const session = await this.createSession(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: this.sanitizeUser(user),
      session_token: session.session_token,
      csrf_token: session.csrf_token,
    };
  }

  async logout(sessionToken: string) {
    const session = await this.prisma.session.findUnique({
      where: { session_token: sessionToken },
      include: { user: true },
    });

    if (session) {
      // Delete session
      await this.prisma.session.delete({
        where: { id: session.id },
      });

      // Create audit log
      await this.auditService.log({
        actor_user_id: session.user_id,
        action: 'LOGOUT',
        entity: 'sessions',
        entity_id: session.id,
      });

      this.logger.log(`User logged out: ${session.user.email}`);
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (user && user.active) {
      const isPasswordValid = await argon2.verify(user.password_hash, password);
      if (isPasswordValid) {
        return this.sanitizeUser(user);
      }
    }

    return null;
  }

  async validateSession(sessionToken: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        session_token: sessionToken,
        expires_at: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session || !session.user.active) {
      return null;
    }

    // Update last accessed
    await this.prisma.session.update({
      where: { id: session.id },
      data: { last_accessed: new Date() },
    });

    return {
      user: this.sanitizeUser(session.user),
      session,
    };
  }

  async refreshToken(sessionToken: string) {
    const session = await this.validateSession(sessionToken);

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    // Generate new session token
    const newSessionToken = uuidv4();

    await this.prisma.session.update({
      where: { id: session.session.id },
      data: {
        session_token: newSessionToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      session_token: newSessionToken,
      csrf_token: session.session.csrf_token,
    };
  }

  private async createSession(userId: string) {
    const sessionToken = uuidv4();
    const csrfToken = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    return this.prisma.session.create({
      data: {
        user_id: userId,
        session_token: sessionToken,
        csrf_token: csrfToken,
        expires_at: expiresAt,
      },
    });
  }

  private sanitizeUser(user: any) {
    const { password_hash, ...sanitized } = user;
    return sanitized;
  }
}
