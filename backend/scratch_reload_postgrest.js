const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Sending reload schema notification to PostgREST...');
    await prisma.$executeRawUnsafe("NOTIFY pgrst, 'reload schema';");
    console.log('PostgREST cache reloaded successfully!');
  } catch (err) {
    console.error('Error reloading PostgREST cache:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
