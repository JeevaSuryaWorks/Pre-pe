const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to add rejection_reason column to kyc_verifications...');
    await prisma.$executeRawUnsafe(`ALTER TABLE "kyc_verifications" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;`);
    console.log('Column added successfully!');
    
    console.log('Notifying PostgREST to reload schema cache...');
    await prisma.$executeRawUnsafe(`NOTIFY pgrst, 'reload schema';`);
    console.log('PostgREST notification sent successfully!');
  } catch (err) {
    console.error('Error in schema migration script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
