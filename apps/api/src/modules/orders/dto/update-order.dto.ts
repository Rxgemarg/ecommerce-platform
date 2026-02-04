import { IsString, IsObject, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export class UpdateOrderDto {
  @IsOptional()
  @IsIn([
    'PENDING',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ])
  status?: OrderStatus;

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
  notes?: string;
}
