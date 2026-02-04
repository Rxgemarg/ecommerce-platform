import { z } from 'zod';

// Field schema for dynamic product types
export const ProductFieldSchema = z.object({
  key: z.string().min(1, 'Field key is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['string', 'number', 'boolean', 'enum', 'date', 'file', 'measurement']),
  required: z.boolean().default(false),
  min: z.number().optional(),
  max: z.number().optional(),
  options: z.array(z.string()).optional(),
  unit: z.string().optional(),
  description: z.string().optional(),
});

export const ProductTypeSchema = z.object({
  name: z.string().min(1, 'Product type name is required'),
  slug: z.string().min(1, 'Product type slug is required'),
  schema_json: z.object({
    fields: z.array(ProductFieldSchema),
  }),
  ui_schema_json: z.object({
    layout: z.string().optional(),
    sections: z.array(z.object({
      title: z.string(),
      fields: z.array(z.string()),
    })).optional(),
    field_config: z.record(z.object({
      width: z.string().optional(),
      placeholder: z.string().optional(),
      help_text: z.string().optional(),
    })).optional(),
  }).optional(),
  search_facets_json: z.object({
    facets: z.array(z.object({
      key: z.string(),
      label: z.string(),
      type: z.enum(['range', 'checkbox', 'select']),
      sort_order: z.number().optional(),
    })),
  }).optional(),
  active: z.boolean().default(true),
  sort_order: z.number().default(0),
});

export const ProductSchema = z.object({
  type_id: z.string().uuid('Invalid product type ID'),
  title: z.string().min(1, 'Product title is required'),
  description: z.string().optional(),
  base_price: z.number().min(0, 'Base price must be positive'),
  currency: z.string().default('USD'),
  sku_base: z.string().optional(),
  attributes_json: z.record(z.any()).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  meta_tags: z.record(z.any()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).default('DRAFT'),
});

export const ProductVariantSchema = z.object({
  product_id: z.string().uuid('Invalid product ID'),
  sku: z.string().min(1, 'SKU is required'),
  title: z.string().optional(),
  price_override: z.number().min(0).optional(),
  inventory_qty: z.number().int().min(0).default(0),
  weight: z.number().min(0).optional(),
  dimensions: z.object({
    length: z.number().min(0),
    width: z.number().min(0),
    height: z.number().min(0),
  }).optional(),
  options_json: z.record(z.any()).optional(),
  image_urls: z.array(z.string().url()).optional(),
  active: z.boolean().default(true),
});

export const ProductSearchSchema = z.object({
  q: z.string().optional(),
  type_id: z.string().uuid().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  attributes: z.record(z.any()).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sort: z.enum(['created_at', 'title', 'base_price']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});