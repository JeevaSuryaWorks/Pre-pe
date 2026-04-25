const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rows = await prisma.$queryRaw`SELECT * FROM reward_settings;`;
    console.log('Rows:', rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
