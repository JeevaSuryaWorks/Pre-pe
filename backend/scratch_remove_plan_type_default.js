const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Removing default value constraint from profiles.plan_type column...');
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.profiles 
      ALTER COLUMN plan_type DROP DEFAULT;
    `);
    
    console.log('Successfully dropped DEFAULT from profiles.plan_type.');

    // Verify change
    const defaultVal = await prisma.$queryRaw`
      SELECT column_name, column_default, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'profiles' 
        AND column_name = 'plan_type';
    `;
    console.log('Verification result:', defaultVal);
    
  } catch (err) {
    console.error('Error during altering profiles.plan_type:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
