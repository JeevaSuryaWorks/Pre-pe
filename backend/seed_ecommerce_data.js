const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting E-Commerce High-Fidelity Seeding...');

    // 1. Find a valid profile to link the seller to
    const profiles = await prisma.profiles.findMany({ take: 3 });
    if (profiles.length === 0) {
      throw new Error('No user profiles found in the database. Please register at least one user first.');
    }

    // Prefer JEEVASURYA's user_id if it exists, otherwise take first profile
    const targetProfile = profiles.find(p => p.email && p.email.includes('gegoja1234')) || profiles[0];
    console.log(`Using profile ${targetProfile.full_name} (${targetProfile.email}) as the default seller user.`);

    // 2. Create Category Records
    console.log('Seeding Categories...');
    const categoriesData = [
      {
        name: 'Premium Phone Cases',
        slug: 'cases',
        description: 'Sleek, drop-tested protective armor and clear crystal magsafe phone cases.',
        image_url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=600'
      },
      {
        name: 'Super-Fast Chargers',
        slug: 'chargers',
        description: 'GaN technology adapters and wireless charging pads for quick power-ups.',
        image_url: 'https://images.unsplash.com/photo-1622445262465-2481c4574875?q=80&w=600'
      },
      {
        name: 'Tempered Glass & Protectors',
        slug: 'screen-protectors',
        description: 'High-density scratch-proof glass with easy installation alignments.',
        image_url: 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=600'
      },
      {
        name: 'Premium Audio Gear',
        slug: 'audio',
        description: 'True Wireless Stereo earbuds and neckbands with Active Noise Cancellation.',
        image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600'
      },
      {
        name: 'Heavy-Duty Cables',
        slug: 'cables',
        description: 'Braided fast-charging and data synchronization Type-C/Lightning cords.',
        image_url: 'https://images.unsplash.com/photo-1585672841961-460d3fc14421?q=80&w=600'
      }
    ];

    const categories = [];
    for (const cat of categoriesData) {
      const dbCat = await prisma.ecommerce_categories.upsert({
        where: { slug: cat.slug },
        update: cat,
        create: cat
      });
      categories.push(dbCat);
    }
    console.log(`Seeded ${categories.length} categories.`);

    // 3. Create Seller
    console.log('Seeding Seller...');
    const seller = await prisma.ecommerce_sellers.upsert({
      where: { user_id: targetProfile.user_id },
      update: {
        company_name: 'Prepe Mobile Accessories Hub',
        gstin: '22AAAAA0000A1Z5',
        business_phone: targetProfile.phone || '9789456787',
        address: '123 Saffron Boulevard, Tech Park, Chennai, Tamil Nadu',
        kyc_status: 'APPROVED',
        status: 'ACTIVE',
        commission_fee: 5.00
      },
      create: {
        user_id: targetProfile.user_id,
        company_name: 'Prepe Mobile Accessories Hub',
        gstin: '22AAAAA0000A1Z5',
        business_phone: targetProfile.phone || '9789456787',
        address: '123 Saffron Boulevard, Tech Park, Chennai, Tamil Nadu',
        kyc_status: 'APPROVED',
        status: 'ACTIVE',
        commission_fee: 5.00
      }
    });
    console.log(`Seller configured: ${seller.company_name} (ID: ${seller.id})`);

    // 4. Create Standard Coupons
    console.log('Seeding Coupons...');
    const couponsData = [
      {
        code: 'ACC10',
        discount_type: 'PERCENTAGE',
        value: 10.00,
        min_order_value: 499.00,
        max_discount: 150.00,
        is_active: true,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year expiry
      },
      {
        code: 'PREPE50',
        discount_type: 'FLAT',
        value: 50.00,
        min_order_value: 299.00,
        max_discount: 50.00,
        is_active: true,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'FIRST30',
        discount_type: 'PERCENTAGE',
        value: 30.00,
        min_order_value: 999.00,
        max_discount: 300.00,
        is_active: true,
        start_date: new Date(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    ];

    for (const coup of couponsData) {
      await prisma.ecommerce_coupons.upsert({
        where: { code: coup.code },
        update: coup,
        create: coup
      });
    }
    console.log('Coupons seeded successfully.');

    // 5. Seed Premium Products & Variants
    console.log('Seeding Products & Variants...');
    const casesCat = categories.find(c => c.slug === 'cases');
    const chargersCat = categories.find(c => c.slug === 'chargers');
    const audioCat = categories.find(c => c.slug === 'audio');
    const cablesCat = categories.find(c => c.slug === 'cables');
    const screensCat = categories.find(c => c.slug === 'screen-protectors');

    const productsData = [
      {
        category_id: casesCat.id,
        title: 'Spigen Ultra Hybrid Magsafe Case for iPhone 15 Pro',
        description: 'Showcase your iPhone 15 Pro design while protecting it with the crystal-clear MagSafe hybrid bumper case. Raised lips protect the screen and camera lens from flat surfaces.',
        price: 1499.00,
        compare_at_price: 1999.00,
        brand: 'Spigen',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?q=80&w=600',
          'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600'
        ]),
        rating: 4.8,
        is_active: true,
        specifications: JSON.stringify({
          'Material': 'TPU + Polycarbonate Bumper',
          'MagSafe Compatible': 'Yes',
          'Drop Test Certified': 'Military Grade (MIL-STD 810G)',
          'Thickness': '1.2mm'
        }),
        variants: [
          { name: 'Crystal Clear', stock: 50, sku: 'SPG-IP15P-CC' },
          { name: 'Matte Black Bumper', stock: 35, sku: 'SPG-IP15P-MB' },
          { name: 'Deep Purple Edge', stock: 20, sku: 'SPG-IP15P-DP' }
        ]
      },
      {
        category_id: chargersCat.id,
        title: 'Anker PowerPort III GaN 65W Pod Adapter',
        description: 'High-speed charging powered by GaN Technology. Power up an iPhone 3x faster than standard chargers, or power down a MacBook Pro 13 in just over 2 hours.',
        price: 2499.00,
        compare_at_price: 3499.00,
        brand: 'Anker',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1622445262465-2481c4574875?q=80&w=600',
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=600'
        ]),
        rating: 4.7,
        is_active: true,
        specifications: JSON.stringify({
          'Total Wattage': '65W',
          'Ports': '2x USB-C, 1x USB-A',
          'Technology': 'GaN II Fast Charging',
          'Weight': '112g'
        }),
        variants: [
          { name: 'Triple Port White', stock: 80, sku: 'ANK-GAN65-WHT' },
          { name: 'Triple Port Slate Black', stock: 95, sku: 'ANK-GAN65-BLK' }
        ]
      },
      {
        category_id: audioCat.id,
        title: 'OnePlus Buds Pro 2 Bluetooth Earbuds',
        description: 'Experience deep immersive soundscapes with active noise cancellation up to 48dB. Features dual drivers co-created with Dynaudio and spatial audio surround support.',
        price: 9999.00,
        compare_at_price: 11999.00,
        brand: 'OnePlus',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600',
          'https://images.unsplash.com/photo-1608156639585-b3a032ef9689?q=80&w=600'
        ]),
        rating: 4.6,
        is_active: true,
        specifications: JSON.stringify({
          'ANC depth': '48dB Smart ANC',
          'Battery Life': 'Up to 39 Hours with Case',
          'Bluetooth Version': '5.3 LE Audio',
          'Water Resistance': 'IP55 Sweatproof'
        }),
        variants: [
          { name: 'Arbor Green', stock: 25, sku: 'OP-BUDSP2-GRN' },
          { name: 'Obsidian Black', stock: 40, sku: 'OP-BUDSP2-BLK' }
        ]
      },
      {
        category_id: cablesCat.id,
        title: 'Belkin Braided USB-C to USB-C 100W Power Cable (2m)',
        description: 'Tough braided nylon exterior keeps the cable safe from bending, pulling, and daily wear-and-tear. Fully supports Power Delivery fast charging up to 100W.',
        price: 899.00,
        compare_at_price: 1299.00,
        brand: 'Belkin',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1585672841961-460d3fc14421?q=80&w=600'
        ]),
        rating: 4.9,
        is_active: true,
        specifications: JSON.stringify({
          'Length': '2 Meters / 6.6 Feet',
          'Max Power Output': '100W PD Support',
          'Material': 'Double-Braided Nylon Shielding',
          'Data Transfer Rate': '480 Mbps'
        }),
        variants: [
          { name: 'Carbon Black', stock: 120, sku: 'BEL-C2C-2M-BLK' },
          { name: 'Snow White', stock: 75, sku: 'BEL-C2C-2M-WHT' },
          { name: 'Ocean Blue', stock: 30, sku: 'BEL-C2C-2M-BLU' }
        ]
      },
      {
        category_id: screensCat.id,
        title: 'Spigen Glas.tR EZ Fit Glass for Samsung Galaxy S24 Ultra',
        description: 'Includes a revolutionary auto-alignment tray for effortless glass application. Premium 9H hardness rating shields against deep scratches and high impacts.',
        price: 999.00,
        compare_at_price: 1499.00,
        brand: 'Spigen',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1605236453806-6ff36851218e?q=80&w=600'
        ]),
        rating: 4.7,
        is_active: true,
        specifications: JSON.stringify({
          'Hardness': '9H Hardness Tempered Glass',
          'Alignment': 'EZ Fit Auto Alignment Tray',
          'Coating': 'Oleophobic Fingerprint Resistant',
          'Quantity': '2 Protectors Pack'
        }),
        variants: [
          { name: 'EZ Fit Pack of 2', stock: 150, sku: 'SPG-S24U-EZ2' }
        ]
      }
    ];

    for (const prodData of productsData) {
      const { variants, ...prodFields } = prodData;

      // Find or create the product
      // We check by title & seller
      const existingProduct = await prisma.ecommerce_products.findFirst({
        where: {
          title: prodFields.title,
          seller_id: seller.id
        }
      });

      let product;
      if (existingProduct) {
        console.log(`Product "${prodFields.title}" already exists, updating fields...`);
        product = await prisma.ecommerce_products.update({
          where: { id: existingProduct.id },
          data: {
            ...prodFields,
            images: JSON.parse(prodFields.images),
            specifications: JSON.parse(prodFields.specifications)
          }
        });
      } else {
        console.log(`Creating product "${prodFields.title}"...`);
        product = await prisma.ecommerce_products.create({
          data: {
            ...prodFields,
            images: JSON.parse(prodFields.images),
            specifications: JSON.parse(prodFields.specifications),
            seller_id: seller.id
          }
        });
      }

      // Seed variants
      for (const variant of variants) {
        await prisma.ecommerce_variants.upsert({
          where: { sku: variant.sku },
          update: {
            name: variant.name,
            stock: variant.stock,
            product_id: product.id
          },
          create: {
            product_id: product.id,
            name: variant.name,
            sku: variant.sku,
            stock: variant.stock
          }
        });
      }
    }

    console.log('Successfully completed E-Commerce High-Fidelity Seeding!');
  } catch (err) {
    console.error('Seeding crashed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
