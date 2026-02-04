import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const SearchSchema = z.object({
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const DateRangeSchema = z.object({
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export const IdSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export const SlugSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

export const FileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number(),
  buffer: z.instanceof(Buffer),
});

export const ImageUploadSchema = FileUploadSchema.extend({
  mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  size: z.number().max(5 * 1024 * 1024), // 5MB
});

export const CouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().min(0, 'Coupon value must be positive'),
  minimum_amount: z.number().min(0).optional(),
  usage_limit: z.number().int().min(1).optional(),
  expires_at: z.string().datetime().optional(),
  active: z.boolean().default(true),
});

export const EventSchema = z.object({
  type: z.enum([
    'PAGE_VIEW',
    'PRODUCT_VIEW',
    'ADD_TO_CART',
    'REMOVE_FROM_CART',
    'SEARCH',
    'CHECKOUT_START',
    'CHECKOUT_COMPLETE',
    'SIGNUP',
    'LOGIN'
  ]),
  user_id: z.string().uuid().optional(),
  session_id: z.string().optional(),
  payload: z.record(z.any()).optional(),
});