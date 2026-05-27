const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Altering kyc_verifications.aadhar_number to be nullable...');
    
    // Drop NOT NULL from aadhar_number column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.kyc_verifications 
      ALTER COLUMN aadhar_number DROP NOT NULL;
    `);
    
    console.log('Successfully dropped NOT NULL constraint from kyc_verifications.aadhar_number.');

    // Force PostgREST to reload schema cache so changes are immediately reflected in REST API
    console.log('Notifying PostgREST to reload schema...');
    await prisma.$executeRawUnsafe(`
      NOTIFY pgrst, 'reload schema';
    `);
    console.log('PostgREST schema reload signal sent successfully.');

    // Verify change
    const defaultVal = await prisma.$queryRaw`
      SELECT column_name, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'kyc_verifications' 
        AND column_name = 'aadhar_number';
    `;
    console.log('Verification result:', defaultVal);
    
  } catch (err) {
    console.error('Error during altering kyc_verifications:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
