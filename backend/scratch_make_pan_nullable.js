const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Altering kyc_verifications.pan_number to be nullable...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.kyc_verifications 
      ALTER COLUMN pan_number DROP NOT NULL;
    `);
    
    console.log('Successfully dropped NOT NULL constraint from kyc_verifications.pan_number.');

    // Verify change
    const defaultVal = await prisma.$queryRaw`
      SELECT column_name, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'kyc_verifications' 
        AND column_name = 'pan_number';
    `;
    console.log('Verification result:', defaultVal);
    
  } catch (err) {
    console.error('Error during altering kyc_verifications:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
