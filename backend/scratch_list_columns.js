const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const defaults = await prisma.$queryRaw`
      SELECT table_name, column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name IN ('reward_points_ledger', 'scratch_cards', 'user_completed_tasks')
        AND column_name = 'id';
    `;
    console.log('Defaults:', defaults);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();

