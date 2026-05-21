const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const kycRecords = await prisma.$queryRaw`
      SELECT id, user_id, status, document_urls 
      FROM public.kyc_verifications 
      LIMIT 10;
    `;
    console.log('KYC Records:', JSON.stringify(kycRecords, null, 2));
  } catch (err) {
    console.error('Error fetching KYC records:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
