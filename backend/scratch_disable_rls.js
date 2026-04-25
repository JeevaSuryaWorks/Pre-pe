const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Disabling RLS on reward_settings...');
    await prisma.$executeRaw`ALTER TABLE reward_settings DISABLE ROW LEVEL SECURITY;`;
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
