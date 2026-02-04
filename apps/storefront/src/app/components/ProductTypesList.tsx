'use client';

import { Card, CardHeader, CardTitle, CardDescription } from '@ecommerce/ui';

interface ProductType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  active: boolean;
  sort_order: number;
}

interface ProductTypesListProps {
  productTypes: ProductType[];
}

export function ProductTypesList({ productTypes }: ProductTypesListProps) {
  if (!productTypes || productTypes.length === 0) {
    return (
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Browse Categories</h2>
        <p className="text-muted-foreground">No categories available yet.</p>
      </section>
    );
  }

  // Sort by sort_order
  const sortedTypes = [...productTypes].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">Browse Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sortedTypes.map((type) => (
          <a
            key={type.id}
            href={`/category/${type.slug}`}
            className="block transition-transform hover:scale-105"
          >
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{type.name}</CardTitle>
                {type.description && (
                  <CardDescription className="line-clamp-2">
                    {type.description}
                  </CardDescription>
                )}
              </CardHeader>
            </Card>
          </a>
        ))}
      </div>
    </section>
  );
}
