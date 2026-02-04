import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @Public()
  trackEvent(
    @Body(ValidationPipe) trackEventDto: TrackEventDto,
    @Request() req: any
  ) {
    return this.analyticsService.trackEvent({
      ...trackEventDto,
      ip_address: req.ip,
      user_agent: req.get('user-agent'),
      session_id: req.cookies?.session_token || trackEventDto.session_id,
    });
  }

  @Get('dashboard')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT')
  getDashboardKpis(@Query('start') start?: string, @Query('end') end?: string) {
    const dateRange = start && end ? { start, end } : undefined;
    return this.analyticsService.getDashboardKpis(dateRange);
  }

  @Get('sales')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  getSalesAnalytics(
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    const dateRange = start && end ? { start, end } : undefined;
    return this.analyticsService.getSalesAnalytics(dateRange);
  }

  @Get('products')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  getProductAnalytics(
    @Query('start') start?: string,
    @Query('end') end?: string
  ) {
    const dateRange = start && end ? { start, end } : undefined;
    return this.analyticsService.getProductAnalytics(dateRange);
  }
}
