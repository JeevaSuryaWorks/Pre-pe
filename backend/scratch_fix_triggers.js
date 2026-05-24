const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- Fixing handle_new_user trigger function ---');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        -- Create profile (specifying all NOT NULL columns: id, created_at, updated_at)
        INSERT INTO public.profiles (id, user_id, email, full_name, created_at, updated_at)
        VALUES (gen_random_uuid(), NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name', NOW(), NOW());
        
        -- Create wallet with 0 balance (specifying all NOT NULL columns: id, created_at, updated_at)
        INSERT INTO public.wallets (id, user_id, balance, locked_balance, created_at, updated_at)
        VALUES (gen_random_uuid(), NEW.id, 0, 0, NOW(), NOW());
        
        -- Assign default user role (specifying all NOT NULL columns: id, created_at)
        INSERT INTO public.user_roles (id, user_id, role, created_at)
        VALUES (gen_random_uuid(), NEW.id, 'user', NOW());
        
        RETURN NEW;
      END;
      $$;
    `);
    console.log('✓ handle_new_user updated successfully!');

    console.log('--- Fixing handle_new_user_wallet trigger function ---');
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.wallets (id, user_id, balance, locked_balance, created_at, updated_at)
        VALUES (gen_random_uuid(), NEW.id, 0, 0, NOW(), NOW())
        ON CONFLICT (user_id) DO NOTHING;
        RETURN NEW;
      END;
      $$;
    `);
    console.log('✓ handle_new_user_wallet updated successfully!');

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
