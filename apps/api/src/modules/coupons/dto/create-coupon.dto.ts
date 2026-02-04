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

export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export class CreateCouponDto {
  @IsString()
  code: string;

  @IsIn(['PERCENTAGE', 'FIXED_AMOUNT'])
  type: CouponType;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  value: number;

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
