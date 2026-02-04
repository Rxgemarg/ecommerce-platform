import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponDto, CouponType } from './create-coupon.dto';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsIn,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsIn(['PERCENTAGE', 'FIXED_AMOUNT'])
  @IsOptional()
  type?: CouponType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  value?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Type(() => Number)
  minimum_amount?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  usage_limit?: number;

  @IsOptional()
  @Type(() => Date)
  expires_at?: Date;

  @IsBoolean()
  @IsOptional()
  active?: boolean;
}
