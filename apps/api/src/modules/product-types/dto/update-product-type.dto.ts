import { PartialType } from '@nestjs/mapped-types';
import { CreateProductTypeDto } from './create-product-type.dto';
import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProductTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsObject()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value && (typeof value === 'string' ? value : JSON.stringify(value))
  )
  schema_json?: Record<string, any> | string;

  @IsObject()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value && (typeof value === 'string' ? value : JSON.stringify(value))
  )
  ui_schema_json?: Record<string, any> | string;

  @IsObject()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value && (typeof value === 'string' ? value : JSON.stringify(value))
  )
  search_facets_json?: Record<string, any> | string;

  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @IsInt()
  @IsOptional()
  sort_order?: number;
}
