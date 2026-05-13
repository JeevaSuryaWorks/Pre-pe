import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jwylhqnbjdsevwbsecjv:3ZDXClekuN4LIMQu@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
    }
  }
});

async function main() {
  console.log("Connecting...");
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE public.kyc_verifications ALTER COLUMN pan_number DROP NOT NULL;`);
    console.log("Success: pan_number is now nullable");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
