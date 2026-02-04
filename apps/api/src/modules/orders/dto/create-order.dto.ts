import {
  IsArray,
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  variant_id: string;

  @Type(() => Number)
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value && (typeof value === 'string' ? value : JSON.stringify(value))
  )
  shipping_address?: Record<string, any> | string;

  @IsObject()
  @IsOptional()
  @Transform(
    ({ value }) =>
      value && (typeof value === 'string' ? value : JSON.stringify(value))
  )
  billing_address?: Record<string, any> | string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  coupon_code?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
