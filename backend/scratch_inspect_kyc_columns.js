const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const cols = await prisma.$queryRaw`
      SELECT column_name, ordinal_position, is_nullable, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'kyc_verifications'
      ORDER BY ordinal_position;
    `;
    console.log('kyc_verifications columns:');
    console.table(cols);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
