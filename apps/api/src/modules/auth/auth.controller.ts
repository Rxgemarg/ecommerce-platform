import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  Get,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { CsrfGuard } from './guards/csrf.guard';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(
    @Body(ValidationPipe) registerDto: RegisterDto,
    @Response() res: ExpressResponse
  ) {
    try {
      const result = await this.authService.register(registerDto);

      // Set HTTP-only cookie
      res.cookie('session_token', result.session_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: result.user,
        csrf_token: result.csrf_token,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  @Public()
  @UseGuards(LocalAuthGuard, CsrfGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse
  ) {
    try {
      const { email, password } = loginDto;
      const ipAddress = req.ip;
      const userAgent = req.get('user-agent');

      const result = await this.authService.login(
        email,
        password,
        ipAddress,
        userAgent
      );

      // Set HTTP-only cookie
      res.cookie('session_token', result.session_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        user: result.user,
        csrf_token: result.csrf_token,
      });
    } catch (error) {
      res.status(401).json({ message: error.message });
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, CsrfGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req: ExpressRequest,
    @Response() res: ExpressResponse
  ) {
    const sessionToken = req.cookies?.session_token;

    if (sessionToken) {
      await this.authService.logout(sessionToken);
    }

    // Clear cookie
    res.clearCookie('session_token');
    res.json({ message: 'Logged out successfully' });
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@Request() req: ExpressRequest) {
    const sessionToken = req.cookies?.session_token;

    if (!sessionToken) {
      throw new UnauthorizedException('No session token found');
    }

    return this.authService.refreshToken(sessionToken);
  }
}
