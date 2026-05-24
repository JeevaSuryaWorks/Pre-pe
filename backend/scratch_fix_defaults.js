const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Altering tables to add gen_random_uuid() defaults for id columns...');
    
    // Set default for reward_points_ledger
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.reward_points_ledger 
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `);
    console.log('Successfully set DEFAULT gen_random_uuid() for reward_points_ledger.id');

    // Set default for scratch_cards
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.scratch_cards 
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    `);
    console.log('Successfully set DEFAULT gen_random_uuid() for scratch_cards.id');

    // Re-verify the defaults
    const defaults = await prisma.$queryRaw`
      SELECT table_name, column_name, column_default 
      FROM information_schema.columns 
      WHERE table_name IN ('reward_points_ledger', 'scratch_cards')
        AND column_name = 'id';
    `;
    console.log('Updated Defaults:', defaults);
    
  } catch (err) {
    console.error('Error during altering table defaults:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
