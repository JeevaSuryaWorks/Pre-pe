const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- Columns in public schema that are NOT NULL but have NO DEFAULT ---');
    const cols = await prisma.$queryRaw`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND is_nullable = 'NO' 
        AND column_default IS NULL
        AND table_name NOT LIKE '_prisma%';
    `;
    console.log(JSON.stringify(cols, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
