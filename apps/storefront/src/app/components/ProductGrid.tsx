'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@ecommerce/ui';

interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  base_price: number;
  currency: string;
  status: string;
  type?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

interface ProductGridProps {
  products: Product[];
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price);
}

export function ProductGrid({ products }: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <section>
        <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
        <p className="text-muted-foreground">No products available yet.</p>
      </section>
    );
  }

  // Only show active products on the storefront
  const activeProducts = products.filter((p) => p.status === 'ACTIVE');

  return (
    <section>
      <h2 className="text-2xl font-semibold mb-4">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {activeProducts.map((product) => (
          <a
            key={product.id}
            href={`/product/${product.type?.slug || 'item'}/${product.slug}`}
            className="block transition-transform hover:scale-105"
          >
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-2">{product.title}</CardTitle>
                {product.type && (
                  <CardDescription>{product.type.name}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(product.base_price, product.currency)}
                </p>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
