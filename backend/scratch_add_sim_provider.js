const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to add sim_provider column...');
    await prisma.$executeRaw`ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "sim_provider" TEXT;`;
    console.log('Column added successfully!');

    console.log('Sending reload schema notification to PostgREST...');
    await prisma.$executeRawUnsafe("NOTIFY pgrst, 'reload schema';");
    console.log('PostgREST cache reloaded successfully!');
  } catch (err) {
    console.error('Error adding column/reloading cache:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
