import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto, ProductStatus } from './create-product.dto';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  type_id?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  base_price?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  sku_base?: string;

  @IsObject()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value : JSON.stringify(value)
  )
  attributes_json?: Record<string, any> | string;

  @IsString()
  @IsOptional()
  seo_title?: string;

  @IsString()
  @IsOptional()
  seo_description?: string;

  @IsObject()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value : JSON.stringify(value)
  )
  meta_tags?: Record<string, any> | string;

  @IsIn(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'])
  @IsOptional()
  status?: ProductStatus;
}
