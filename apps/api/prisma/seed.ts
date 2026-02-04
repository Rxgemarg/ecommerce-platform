// Temporary development seed script to create initial admin user
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await argon2.hash('admin123');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password_hash: hashedPassword,
      role: 'OWNER',
      first_name: 'Admin',
      last_name: 'User',
      email_verified: true,
      active: true,
    },
  });

  console.log('✅ Created admin user:', adminUser.email);
  console.log('🔑 Password: admin123');
  
  // Create a sample product type
  const clothingType = await prisma.productType.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      schema_json: JSON.stringify({
        fields: [
          {
            key: 'material',
            label: 'Material',
            type: 'string',
            required: true,
          },
          {
            key: 'size',
            label: 'Size',
            type: 'string',
            required: true,
          },
        ],
      }),
      ui_schema_json: JSON.stringify({
        layout: 'sections',
        sections: [
          {
            title: 'Basic Information',
            fields: ['material', 'size'],
          },
        ],
      }),
      search_facets_json: JSON.stringify({
        facets: [
          {
            key: 'material',
            label: 'Material',
            type: 'checkbox',
          },
        ],
      }),
      active: true,
      sort_order: 0,
    },
  });

  console.log('✅ Created product type:', clothingType.name);

  // Create a sample product
  const sampleProduct = await prisma.product.upsert({
    where: { 
      type_id_slug: {
        type_id: clothingType.id,
        slug: 'sample-t-shirt'
      }
    },
    update: {},
    create: {
      type_id: clothingType.id,
      title: 'Sample T-Shirt',
      slug: 'sample-t-shirt',
      description: 'A comfortable sample t-shirt',
      status: 'ACTIVE',
      base_price: 29.99,
      currency: 'USD',
      sku_base: 'TSHIRT',
      attributes_json: JSON.stringify({
        material: 'Cotton',
        size: 'L',
      }),
    },
  });

  console.log('✅ Created sample product:', sampleProduct.title);

  // Create a sample variant
  const sampleVariant = await prisma.productVariant.upsert({
    where: { sku: 'TSHIRT-L-COTTON' },
    update: {},
    create: {
      product_id: sampleProduct.id,
      sku: 'TSHIRT-L-COTTON',
      title: 'Large Cotton',
      price_override: 29.99,
      inventory_qty: 100,
      options_json: JSON.stringify({
        size: 'L',
        material: 'Cotton',
      }),
      active: true,
    },
  });

  console.log('✅ Created sample variant:', sampleVariant.sku);

  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });