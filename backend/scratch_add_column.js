const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to add columns...');
    await prisma.$executeRaw`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "custom_spin_limit" INTEGER;`;
    await prisma.$executeRaw`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "plan_type" VARCHAR(20) DEFAULT 'BASIC';`;
    console.log('Success!');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
