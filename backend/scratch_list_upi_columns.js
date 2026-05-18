const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Querying columns for upi_transactions...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'upi_transactions';
    `;
    console.log('Existing columns:', columns);

    const existingNames = columns.map(c => c.column_name);

    // List of all columns required by the Prisma schema model upi_transactions
    const requiredColumns = [
      { name: 'upi_ref_id', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "upi_ref_id" VARCHAR(255);' },
      { name: 'razorpay_payment_id', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" VARCHAR(255);' },
      { name: 'gateway_status', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "gateway_status" VARCHAR(255);' },
      { name: 'failure_reason', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "failure_reason" TEXT;' },
      { name: 'failure_message', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "failure_message" TEXT;' },
      { name: 'app_used', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "app_used" VARCHAR(255);' },
      { name: 'intent_url', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "intent_url" TEXT;' },
      { name: 'qr_code', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "qr_code" TEXT;' },
      { name: 'payment_method', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "payment_method" VARCHAR(255);' },
      { name: 'raw_response', sql: 'ALTER TABLE "upi_transactions" ADD COLUMN IF NOT EXISTS "raw_response" JSONB;' }
    ];

    for (const col of requiredColumns) {
      if (!existingNames.includes(col.name)) {
        console.log(`Adding missing column: ${col.name}`);
        await prisma.$executeRawUnsafe(col.sql);
        console.log(`Successfully added ${col.name}!`);
      } else {
        console.log(`Column ${col.name} already exists.`);
      }
    }

    // Add unique constraints if needed, but IF NOT EXISTS isn't supported for constraints in standard ALTER in some PG versions.
    // So we can use a try-catch for adding constraints.
    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "upi_transactions" ADD CONSTRAINT "upi_transactions_upi_ref_id_key" UNIQUE ("upi_ref_id");');
      console.log('Added unique constraint on upi_ref_id.');
    } catch (e) {
      console.log('Constraint on upi_ref_id might already exist:', e.message);
    }

    try {
      await prisma.$executeRawUnsafe('ALTER TABLE "upi_transactions" ADD CONSTRAINT "upi_transactions_razorpay_payment_id_key" UNIQUE ("razorpay_payment_id");');
      console.log('Added unique constraint on razorpay_payment_id.');
    } catch (e) {
      console.log('Constraint on razorpay_payment_id might already exist:', e.message);
    }

    console.log('All missing upi_transactions columns processed!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
