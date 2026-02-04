import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER')
  create(
    @Body(ValidationPipe) createOrderDto: CreateOrderDto,
    @Request() req: any
  ) {
    return this.ordersService.create(createOrderDto, req.user.id);
  }

  // Public endpoint for guest checkout (optional)
  @Post('guest')
  createGuest(@Body(ValidationPipe) createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('user_id') userId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.ordersService.findAll(
      pageNum,
      limitNum,
      userId,
      status,
      search
    );
  }

  @Get('my')
  findMyOrders(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.ordersService.findAll(pageNum, limitNum, req.user.id, status);
  }

  @Get('number/:orderNumber')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER')
  findByOrderNumber(
    @Param('orderNumber') orderNumber: string,
    @Request() req: any
  ) {
    return this.ordersService.findByOrderNumber(orderNumber, req.user.id);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateOrderDto: UpdateOrderDto,
    @Request() req: any
  ) {
    return this.ordersService.update(id, updateOrderDto, req.user.id);
  }

  @Patch(':id/status')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Request() req: any
  ) {
    return this.ordersService.updateStatus(id, status, req.user.id);
  }
}
