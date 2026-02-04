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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  create(
    @Body(ValidationPipe) createProductDto: CreateProductDto,
    @Request() req: any
  ) {
    return this.productsService.create(createProductDto, req.user.id);
  }

  @Get('search')
  @Public()
  search(
    @Query('q') query?: string,
    @Query('type_id') typeId?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const searchFilters = {
      ...(typeId && { type_id: typeId }),
      ...(minPrice && { min_price: parseFloat(minPrice) }),
      ...(maxPrice && { max_price: parseFloat(maxPrice) }),
      ...(filters?.attributes && { attributes: filters.attributes }),
    };

    return this.productsService.searchProducts(
      query || '',
      searchFilters,
      pageNum,
      limitNum
    );
  }

  @Get()
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER')
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('type_id') typeId?: string,
    @Query('status') status?: string
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    return this.productsService.findAll(
      pageNum,
      limitNum,
      search,
      typeId,
      status
    );
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Get('slug/:typeSlug/:productSlug')
  @Public()
  findBySlug(
    @Param('typeSlug') typeSlug: string,
    @Param('productSlug') productSlug: string
  ) {
    return this.productsService.findBySlug(typeSlug, productSlug);
  }

  @Patch(':id')
  @Roles('OWNER', 'ADMIN', 'MANAGER')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateProductDto: UpdateProductDto,
    @Request() req: any
  ) {
    return this.productsService.update(id, updateProductDto, req.user.id);
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.productsService.remove(id, req.user.id);
  }
}
