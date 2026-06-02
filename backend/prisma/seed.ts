import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with fashion products...');

  // Clear existing products (optional, good for resetting)
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();

  const products = [
    {
      handle: 'white-t-shirt',
      title: 'Classic White T-Shirt',
      description: 'A premium cotton classic white t-shirt for everyday wear.',
      category: 't-shirts',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80',
      variants: {
        create: [
          { sku: 'TS-WHT-S', size: 'S', color: 'White', priceInCents: 2500, stock: 10 },
          { sku: 'TS-WHT-M', size: 'M', color: 'White', priceInCents: 2500, stock: 20 },
        ]
      }
    },
    {
      handle: 'linen-dress',
      title: 'Linen Summer Dress',
      description: 'Breathable and lightweight linen dress, perfect for warm weather.',
      category: 'dresses',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1515347619352-04fd52fa209f?w=800&q=80',
      variants: {
        create: [
          { sku: 'DR-LIN-M', size: 'M', color: 'Beige', priceInCents: 8500, stock: 5 },
        ]
      }
    },
    {
      handle: 'urban-hoodie',
      title: 'Urban Hoodie',
      description: 'Premium cotton hoodie',
      category: 'hoodies',
      status: 'published',
      image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
      variants: {
        create: [
          { sku: 'UH-BLK-M', size: 'M', color: 'Black', priceInCents: 4999, stock: 25 },
        ]
      }
    }
  ];

  for (const p of products) {
    const product = await prisma.product.create({
      data: p,
    });
    console.log(`Created product: ${product.title}`);
  }

  console.log('Seeding finished.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
