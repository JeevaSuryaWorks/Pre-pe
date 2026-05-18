const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Synchronizing upi_transactions database columns with Prisma schema...');
    
    // Add all upi_transactions columns if they don't exist
    await prisma.$executeRaw`ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" VARCHAR(255) UNIQUE;`;
    await prisma.$executeRaw`ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR(255);`;
    await prisma.$executeRaw`ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "failure_message" TEXT;`;
    await prisma.$executeRaw`ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "app_used" VARCHAR(255);`;
    await prisma.$executeRaw`ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "intent_url" TEXT;`;
    await prisma.$executeRaw`ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "qr_code" TEXT;`;
    await prisma.$executeRaw`ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "raw_response" JSONB;`;

    console.log('Success synchronizing upi_transactions columns!');
  } catch (err) {
    console.error('Error synchronizing database columns:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
