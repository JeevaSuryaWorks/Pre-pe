const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔄 Connecting to database and running subscription plans update migration...');

    // 1. Delete legacy spin limit settings
    console.log('🧹 Cleaning up legacy reward settings (spin limits)...');
    await prisma.$executeRaw`
      DELETE FROM public.reward_settings 
      WHERE key IN ('spin_limit_GOLD', 'spin_limit_PREMIUM');
    `;

    // 2. Upsert spin limit settings for PRO and BUSINESS
    console.log('⚙️ Upserting spin limits for BASIC, PRO, and BUSINESS...');
    const spinLimits = [
      { key: 'spin_limit_BASIC', value: '1' },
      { key: 'spin_limit_PRO', value: '3' },
      { key: 'spin_limit_BUSINESS', value: '10' }
    ];
    for (const limit of spinLimits) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.reward_settings (key, value)
        VALUES ($1, $2::jsonb)
        ON CONFLICT (key) DO UPDATE SET value = $2::jsonb;
      `, limit.key, limit.value);
    }

    // 3. Update existing profiles table from GOLD to PRO, PREMIUM to BUSINESS
    console.log('👥 Migrating legacy users on GOLD/PREMIUM to PRO/BUSINESS...');
    await prisma.$executeRaw`
      UPDATE public.profiles 
      SET plan_type = 'PRO' 
      WHERE UPPER(plan_type) = 'GOLD';
    `;
    await prisma.$executeRaw`
      UPDATE public.profiles 
      SET plan_type = 'BUSINESS' 
      WHERE UPPER(plan_type) = 'PREMIUM';
    `;

    // 4. Delete legacy plans
    console.log('🗑️ Deleting legacy plan records from the plans table...');
    await prisma.$executeRaw`
      DELETE FROM public.plans 
      WHERE id IN ('GOLD', 'PREMIUM');
    `;

    // 5. Upsert plans (BASIC, PRO, BUSINESS)
    console.log('🌱 Seeding updated subscription plans (BASIC, PRO, BUSINESS)...');
    
    // BASIC
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.plans (id, name, subtitle, description, price, price_amount, features, is_popular, order_index)
      VALUES (
        'BASIC', 
        'Basic Plan', 
        'Free forever', 
        'Standard recharge and utility tools with no subscription fees.', 
        'Free', 
        0, 
        '["Daily recharge limit: 5", "Standard transaction fees", "Support tickets with standard response time", "Watch ads to earn reward points"]'::jsonb, 
        false, 
        0
      )
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        price_amount = EXCLUDED.price_amount,
        features = EXCLUDED.features,
        is_popular = EXCLUDED.is_popular,
        order_index = EXCLUDED.order_index;
    `);

    // PRO
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.plans (id, name, subtitle, description, price, price_amount, features, is_popular, order_index)
      VALUES (
        'PRO', 
        'Pro Plan', 
        '21 days free Trial', 
        'Perfect for active users looking for cashback discounts and higher monthly limits.', 
        '₹299/mo', 
        299, 
        '["Unlimited daily recharges", "0.5% Cashback on wallet additions", "Priority support resolution (under 6 hours)", "2x Points from Lucky Spin Wheel", "Early access to promo scratch cards"]'::jsonb, 
        true, 
        1
      )
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        price_amount = EXCLUDED.price_amount,
        features = EXCLUDED.features,
        is_popular = EXCLUDED.is_popular,
        order_index = EXCLUDED.order_index;
    `);

    // BUSINESS
    await prisma.$executeRawUnsafe(`
      INSERT INTO public.plans (id, name, subtitle, description, price, price_amount, features, is_popular, order_index)
      VALUES (
        'BUSINESS', 
        'Business Plan', 
        'Specially for Shops', 
        'Industrial-grade limits, zero commission overheads, and immediate dedicated support.', 
        '₹999/mo', 
        999, 
        '["Unlimited daily recharges", "Flat 1.5% cash rebate on all payments", "Immediate dedicated support hotline", "5x Points multiplier on all rewards", "Zero platform surcharge fees"]'::jsonb, 
        false, 
        2
      )
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        subtitle = EXCLUDED.subtitle,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        price_amount = EXCLUDED.price_amount,
        features = EXCLUDED.features,
        is_popular = EXCLUDED.is_popular,
        order_index = EXCLUDED.order_index;
    `);

    console.log('✅ Subscription plans database update completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
