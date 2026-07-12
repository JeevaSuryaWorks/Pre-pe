const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Mobile Holders category and products...');
  try {
    // 1. Find the default seller
    const sellers = await prisma.ecommerce_sellers.findMany({ take: 1 });
    if (sellers.length === 0) {
      throw new Error('No ecommerce sellers found. Please run seed_ecommerce_data.js first.');
    }
    const sellerId = sellers[0].id;
    console.log(`Using seller ID: ${sellerId}`);

    // 2. Create or find Holders category
    const category = await prisma.ecommerce_categories.upsert({
      where: { slug: 'holders' },
      update: {
        name: 'Mobile Holders & Mounts',
        description: 'Heavy-duty motorcycle, bicycle, and car handlebar phone mounts and dashboard cradles.',
        image_url: 'https://images.unsplash.com/photo-1584438784894-089d6a128f3e?q=80&w=600'
      },
      create: {
        name: 'Mobile Holders & Mounts',
        slug: 'holders',
        description: 'Heavy-duty motorcycle, bicycle, and car handlebar phone mounts and dashboard cradles.',
        image_url: 'https://images.unsplash.com/photo-1584438784894-089d6a128f3e?q=80&w=600'
      }
    });
    console.log(`Holders category configured: ${category.name} (${category.id})`);

    // 3. Define the 6 mobile holder products
    const products = [
      {
        title: 'STRIFF MoRide Motorcycle Mobile Holder',
        description: 'Heavy-duty metal motorcycle phone mount. Anti-shake, 360-degree rotation secure grip handlebar mount for bikes and scooters.',
        price: 267.00,
        compare_at_price: 999.00,
        brand: 'STRIFF',
        rating: 4.2,
        images: ['https://images.unsplash.com/photo-1584438784894-089d6a128f3e?q=80&w=600'],
        specifications: {
          'Material': 'Aluminium Alloy',
          'Rotation': '360 Degree Rotation',
          'Mount Type': 'Handlebar Mount',
          'Compatibility': 'Universal (4.0 - 7.0 inches)'
        },
        sku: 'STF-MORIDE-HLD'
      },
      {
        title: 'RGV XY-088 Bike Mobile Holder',
        description: 'Secure grip bicycle and motorcycle handle-bar mount with automated claw lock mechanism.',
        price: 198.00,
        compare_at_price: 999.00,
        brand: 'RGV',
        rating: 4.0,
        images: ['https://images.unsplash.com/photo-1598209279122-8541e16a0f26?q=80&w=600'],
        specifications: {
          'Locking': 'One-Click Automatic Claw Lock',
          'Mount Type': 'Handlebar Mount',
          'Material': 'High-strength ABS Polymer'
        },
        sku: 'RGV-XY088-HLD'
      },
      {
        title: 'Guider Waterproof Mobile Holder',
        description: 'Waterproof touchscreen sensitive bike mount with sun visor. Protective zip bag structure for rainy rides.',
        price: 339.00,
        compare_at_price: 1999.00,
        brand: 'Guider',
        rating: 4.0,
        images: ['https://images.unsplash.com/photo-1557858310-911482e07916?q=80&w=600'],
        specifications: {
          'Waterproof': 'IPX6 Rated Protection',
          'Touch Sensitivity': 'High-sensitivity TPU Touch Window',
          'Sun Visor': 'Integrated Anti-Glare Shield'
        },
        sku: 'GDR-WPF-HLD'
      },
      {
        title: 'X WARRIOR 360 Rotation Mount',
        description: '360-degree rotation universal handlebar mobile holder with silicon strap protection.',
        price: 148.00,
        compare_at_price: 1349.00,
        brand: 'X WARRIOR',
        rating: 4.1,
        images: ['https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=600'],
        specifications: {
          'Rotation': '360° Ball Joint',
          'Strap Material': 'Elastic Tensile Silicone',
          'Color': 'Carbon Black'
        },
        sku: 'XWR-360-HLD'
      },
      {
        title: 'Dronix HANDELBAR Secure Mount',
        description: 'Aluminium alloy bicycle and scooter phone cradle with dual screw tightness.',
        price: 129.00,
        compare_at_price: 999.00,
        brand: 'Dronix',
        rating: 4.0,
        images: ['https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=600'],
        specifications: {
          'Clamping': 'Dual Screw Tension',
          'Material': 'Aviation-Grade Aluminium',
          'Padding': 'Anti-slip Silicon Pads'
        },
        sku: 'DRX-HBAR-HLD'
      },
      {
        title: 'FERONS Selenophile Bike Mount',
        description: 'Premium shockproof anti-shake bicycle mobile holder with multi-corner padding.',
        price: 298.00,
        compare_at_price: 799.00,
        brand: 'FERONS',
        rating: 4.0,
        images: ['https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600'],
        specifications: {
          'Anti-shake': 'Shock-absorbing corner bumpers',
          'Material': 'ABS + Silicon',
          'Fit': '4.7 - 6.8 inch screens'
        },
        sku: 'FRN-SELENO-HLD'
      }
    ];

    // 4. Upsert products and their variants
    for (const p of products) {
      const { sku, ...fields } = p;
      
      const dbProd = await prisma.ecommerce_products.upsert({
        where: { id: sku }, // Using SKU or finding by title
        // Wait, standard schema doesn't have ID as SKU. We find by title or create.
        create: {
          seller_id: sellerId,
          category_id: category.id,
          title: fields.title,
          description: fields.description,
          price: fields.price,
          compare_at_price: fields.compare_at_price,
          brand: fields.brand,
          rating: fields.rating,
          images: fields.images,
          specifications: fields.specifications,
          is_active: true
        },
        update: {
          category_id: category.id,
          description: fields.description,
          price: fields.price,
          compare_at_price: fields.compare_at_price,
          brand: fields.brand,
          rating: fields.rating,
          images: fields.images,
          specifications: fields.specifications,
          is_active: true
        },
        // We find by title + seller unique check
        where: {
          // Since schema mapping doesn't have unique title, we find first and upsert manually
          id: (await prisma.ecommerce_products.findFirst({
            where: { title: fields.title, seller_id: sellerId }
          }))?.id || '00000000-0000-0000-0000-000000000000'
        }
      });

      console.log(`Upserted product: ${dbProd.title} (ID: ${dbProd.id})`);

      // Upsert variant
      await prisma.ecommerce_variants.upsert({
        where: { sku: sku },
        update: {
          name: 'Standard Mount',
          stock: 100,
          product_id: dbProd.id
        },
        create: {
          product_id: dbProd.id,
          name: 'Standard Mount',
          sku: sku,
          stock: 100
        }
      });
    }

    console.log('Mobile Holders seeded successfully!');
  } catch (err) {
    console.error('Seeding holders failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
