// Common types used across the UI components

export interface Product {
  id: string;
  type_id: string;
  title: string;
  slug: string;
  description?: string;
  status: string;
  base_price: number;
  currency: string;
  attributes_json?: Record<string, any>;
  created_at: string;
  updated_at: string;
  type: {
    id: string;
    name: string;
    slug: string;
  };
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  title?: string;
  price_override?: number;
  inventory_qty: number;
  options_json?: Record<string, any>;
  active: boolean;
}

export interface ProductType {
  id: string;
  name: string;
  slug: string;
  schema_json: {
    fields: ProductField[];
  };
  ui_schema_json?: {
    layout?: string;
    sections?: Array<{
      title: string;
      fields: string[];
    }>;
  };
  search_facets_json?: {
    facets: Array<{
      key: string;
      label: string;
      type: 'range' | 'checkbox' | 'select';
    }>;
  };
  active: boolean;
}

export interface ProductField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'file' | 'measurement';
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  unit?: string;
  description?: string;
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  currency: string;
  subtotal: number;
  total_amount: number;
  shipping_address?: Record<string, any>;
  billing_address?: Record<string, any>;
  created_at: string;
  items: OrderItem[];
  user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

export interface OrderItem {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  variant: {
    id: string;
    sku: string;
    title?: string;
    product: {
      id: string;
      title: string;
    };
  };
}

export interface User {
  id: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email_verified: boolean;
  active: boolean;
  created_at: string;
}

export interface CartItem {
  id: string;
  variant: ProductVariant;
  product: Product;
  quantity: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minimum_amount?: number;
  usage_limit?: number;
  usage_count: number;
  active: boolean;
  expires_at?: string;
}