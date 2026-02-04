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
import { ProductTypesService } from './product-types.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('product-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductTypesController {
  constructor(private readonly productTypesService: ProductTypesService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  create(
    @Body(ValidationPipe) createProductTypeDto: CreateProductTypeDto,
    @Request() req: any
  ) {
    return this.productTypesService.create(createProductTypeDto, req.user.id);
  }

  @Get()
  @Public()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.productTypesService.findAll(pageNum, limitNum, search);
  }

  @Get('slug/:slug')
  @Public()
  findBySlug(@Param('slug') slug: string) {
    return this.productTypesService.findBySlug(slug);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER')
  findOne(@Param('id') id: string) {
    return this.productTypesService.findOne(id);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateProductTypeDto: UpdateProductTypeDto,
    @Request() req: any
  ) {
    return this.productTypesService.update(
      id,
      updateProductTypeDto,
      req.user.id
    );
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productTypesService.remove(id, req.user.id);
  }
}
