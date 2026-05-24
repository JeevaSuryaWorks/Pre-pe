const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Disabling RLS on profiles...');
    await prisma.$executeRaw`ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;`;
    console.log('Disabling RLS on wallets...');
    await prisma.$executeRaw`ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;`;
    console.log('Disabling RLS on kyc_verifications...');
    await prisma.$executeRaw`ALTER TABLE public.kyc_verifications DISABLE ROW LEVEL SECURITY;`;
    console.log('Success disabling RLS on profiles, wallets, and kyc_verifications!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
