import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto, UserRole } from './create-user.dto';
import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password_hash?: string;

  @IsIn(['OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER'])
  @IsOptional()
  role?: UserRole;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsOptional()
  email_verified?: boolean;

  @IsOptional()
  active?: boolean;
}
