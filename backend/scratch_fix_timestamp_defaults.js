const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const QUERIES = [
  'ALTER TABLE public.admin_audit_logs ALTER COLUMN created_at SET DEFAULT now();',
  'ALTER TABLE public.commission_slabs ALTER COLUMN created_at SET DEFAULT now();',
  'ALTER TABLE public.commission_slabs ALTER COLUMN updated_at SET DEFAULT now();',
  'ALTER TABLE public.loans ALTER COLUMN updated_at SET DEFAULT now();',
  'ALTER TABLE public.profiles ALTER COLUMN created_at SET DEFAULT now();',
  'ALTER TABLE public.profiles ALTER COLUMN updated_at SET DEFAULT now();',
  'ALTER TABLE public.transactions ALTER COLUMN created_at SET DEFAULT now();',
  'ALTER TABLE public.transactions ALTER COLUMN updated_at SET DEFAULT now();',
  'ALTER TABLE public.upi_transactions ALTER COLUMN created_at SET DEFAULT now();',
  'ALTER TABLE public.upi_transactions ALTER COLUMN updated_at SET DEFAULT now();',
  'ALTER TABLE public.user_roles ALTER COLUMN created_at SET DEFAULT now();',
  'ALTER TABLE public.wallet_ledger ALTER COLUMN created_at SET DEFAULT now();',
  'ALTER TABLE public.wallets ALTER COLUMN created_at SET DEFAULT now();',
  'ALTER TABLE public.wallets ALTER COLUMN updated_at SET DEFAULT now();'
];

async function main() {
  try {
    console.log('Altering tables to add now() defaults for created_at and updated_at columns...');
    
    for (const query of QUERIES) {
      console.log(`Executing: ${query}`);
      try {
        await prisma.$executeRawUnsafe(query);
        console.log('Successfully applied default.');
      } catch (err) {
        console.error(`Failed executing query: ${query}\nError:`, err.message);
      }
    }

    console.log('\nVerifying timestamp defaults...');
    const cols = await prisma.$queryRaw`
      SELECT table_name, column_name, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
        AND column_name IN ('created_at', 'updated_at')
        AND table_name IN ('admin_audit_logs', 'commission_slabs', 'loans', 'profiles', 'transactions', 'upi_transactions', 'user_roles', 'wallet_ledger', 'wallets')
      ORDER BY table_name, column_name;
    `;
    console.table(cols);
    
  } catch (err) {
    console.error('Critical error during timestamp defaults overhaul:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
