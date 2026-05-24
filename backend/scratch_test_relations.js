const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const profiles = await prisma.$queryRaw`SELECT * FROM public.profiles LIMIT 2;`;
    console.log('Profiles Raw:', profiles);

    const wallets = await prisma.$queryRaw`SELECT * FROM public.wallets LIMIT 5;`;
    console.log('Wallets Raw:', wallets);

    const kyc = await prisma.$queryRaw`SELECT * FROM public.kyc_verifications LIMIT 5;`;
    console.log('KYC Raw:', kyc);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
