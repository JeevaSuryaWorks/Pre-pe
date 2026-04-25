const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Seeding spin limits...');
    await prisma.$executeRaw`INSERT INTO reward_settings (key, value) VALUES 
      ('spin_limit_BASIC', '1'::jsonb),
      ('spin_limit_PREMIUM', '3'::jsonb),
      ('spin_limit_VIP', '5'::jsonb)
      ON CONFLICT (key) DO NOTHING;`;
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
