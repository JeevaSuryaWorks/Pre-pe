const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- Step 1: Checking RLS and policies on kyc_verifications table ---');
    const policies = await prisma.$queryRawUnsafe(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'kyc_verifications';
    `);
    console.log('Existing policies:');
    console.table(policies);

    // Also check if RLS is enabled on kyc_verifications
    const rlsStatus = await prisma.$queryRawUnsafe(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'kyc_verifications';
    `);
    console.log('RLS Status (relrowsecurity = true means RLS is enabled):');
    console.table(rlsStatus);

  } catch (err) {
    console.error('Error debugging KYC RLS:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
