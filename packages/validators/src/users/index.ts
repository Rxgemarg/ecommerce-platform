import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password_hash: z.string().min(1, 'Password hash is required'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER']).default('VIEWER'),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  email_verified: z.boolean().default(false),
  active: z.boolean().default(true),
});

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password_hash: z.string().min(1).optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER']).optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  email_verified: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const UserQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'VIEWER']).optional(),
  active: z.boolean().optional(),
  email_verified: z.boolean().optional(),
});