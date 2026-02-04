import {
  IsString,
  IsOptional,
  IsObject,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductTypeDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsObject()
  @Transform(({ value }) =>
    typeof value === 'string' ? value : JSON.stringify(value)
  )
  schema_json: Record<string, any> | string;

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
