const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sqlScript = `
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;
`;

async function main() {
  try {
    console.log('Enabling Row Level Security (RLS) dynamically on all public tables...');
    await prisma.$executeRawUnsafe(sqlScript);
    console.log('Successfully enabled RLS on all public tables!');
  } catch (err) {
    console.error('Error enabling RLS:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
