import { IsEmail, IsString, IsOptional, IsIn } from 'class-validator';

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'SUPPORT' | 'VIEWER';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password_hash: string;

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
