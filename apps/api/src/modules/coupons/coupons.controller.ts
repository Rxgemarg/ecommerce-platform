import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  create(
    @Body(ValidationPipe) createCouponDto: CreateCouponDto,
    @Request() req: any
  ) {
    return this.couponsService.create(createCouponDto, req.user.id);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('active') active?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const activeBool = active !== undefined ? active === 'true' : undefined;

    return this.couponsService.findAll(pageNum, limitNum, search, activeBool);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT')
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Get('code/:code')
  @Public()
  findByCode(
    @Param('code') code: string,
    @Query('subtotal') subtotal?: string
  ) {
    if (subtotal) {
      const subtotalNum = parseFloat(subtotal);
      return this.couponsService.validateCoupon(code, subtotalNum);
    }
    return this.couponsService.findByCode(code);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateCouponDto: UpdateCouponDto,
    @Request() req: any
  ) {
    return this.couponsService.update(id, updateCouponDto, req.user.id);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.couponsService.remove(id, req.user.id);
  }
}
