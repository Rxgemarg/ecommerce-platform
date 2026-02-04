import {
  IsString,
  IsOptional,
  IsNumber,
  IsObject,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export class CreateProductDto {
  @IsString()
  type_id: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Transform(({ value }) => parseFloat(value))
  base_price: number;

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
