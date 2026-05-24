const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const tables = [
      'profiles',
      'wallets',
      'kyc_verifications',
      'wallet_ledger',
      'admin_audit_logs',
      'transactions',
      'manual_fund_requests',
      'scratch_cards',
      'reward_points_ledger',
      'gift_vouchers',
      'banners',
      'plans',
      'reward_settings',
      'rewards_tasks',
      'user_completed_tasks'
    ];

    for (const table of tables) {
      console.log(`Disabling RLS on ${table}...`);
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;`);
        console.log(`Successfully disabled RLS on ${table}`);
      } catch (err) {
        console.error(`Failed to disable RLS on ${table}:`, err.message);
      }
    }
    console.log('All RLS disable statements executed!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
