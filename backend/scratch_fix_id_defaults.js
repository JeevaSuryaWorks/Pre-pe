const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TABLES = [
  'profiles',
  'user_roles',
  'wallets',
  'wallet_ledger',
  'transactions',
  'upi_transactions',
  'commission_slabs',
  'loans',
  'admin_audit_logs',
  'kyc_verifications',
  'manual_fund_requests',
  'reward_points_ledger',
  'scratch_cards',
  'gift_card_vouchers',
  'support_tickets'
];

async function main() {
  try {
    console.log('Altering tables to add gen_random_uuid() defaults for id columns...');
    
    for (const table of TABLES) {
      console.log(`Setting DEFAULT gen_random_uuid() for public.${table}.id...`);
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE public.${table} 
          ALTER COLUMN id SET DEFAULT gen_random_uuid();
        `);
        console.log(`Successfully updated public.${table}.id`);
      } catch (tableErr) {
        console.error(`Failed to update public.${table}.id:`, tableErr.message);
      }
    }

    console.log('\nVerifying defaults from information_schema...');
    const defaults = await prisma.$queryRaw`
      SELECT table_name, column_name, column_default 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND column_name = 'id'
        AND table_name = ANY(${TABLES});
    `;
    console.log('Updated Defaults Summary:');
    console.table(defaults);
    
  } catch (err) {
    console.error('Critical error during defaults overhaul:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
