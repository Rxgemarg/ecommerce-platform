import { z } from 'zod';

export const OrderItemSchema = z.object({
  variant_id: z.string().uuid('Invalid product variant ID'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zip_code: z.string().min(1, 'ZIP code is required'),
  country: z.string().min(1, 'Country is required'),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, 'At least one item is required'),
  shipping_address: AddressSchema.optional(),
  billing_address: AddressSchema.optional(),
  currency: z.string().default('USD'),
  coupon_code: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateOrderSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  shipping_address: AddressSchema.optional(),
  billing_address: AddressSchema.optional(),
  notes: z.string().optional(),
});

export const OrderQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  user_id: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  search: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});