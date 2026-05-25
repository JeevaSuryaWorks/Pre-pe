const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const basicConfig = {
  dailyRechargeLimit: 5,
  dailyWalletAddLimit: 500,
  maxWalletBalance: 1000,
  bnplLimit: 0,
  bnplCycleDays: 0,
  commissionMultiplier: 1.0,
  referralReward: 0,
  features: {
    kycRequired: false,
    bnpl: false,
    cashback: false,
    ads: true,
    prioritySupport: false,
    withdrawalAllowed: false,
    bulkTools: false,
    rewards: "BASIC"
  }
};

const proConfig = {
  dailyRechargeLimit: 999999,
  dailyWalletAddLimit: 10000,
  maxWalletBalance: 25000,
  bnplLimit: 1000,
  bnplCycleDays: 15,
  commissionMultiplier: 1.0,
  referralReward: 0,
  features: {
    kycRequired: true,
    bnpl: true,
    cashback: true,
    ads: false,
    prioritySupport: true,
    withdrawalAllowed: true,
    bulkTools: false,
    rewards: "PREMIUM"
  }
};

const businessConfig = {
  dailyRechargeLimit: 999999,
  dailyWalletAddLimit: 999999,
  maxWalletBalance: 999999,
  bnplLimit: 3000,
  bnplCycleDays: 30,
  commissionMultiplier: 1.0,
  referralReward: 0,
  features: {
    kycRequired: true,
    bnpl: true,
    cashback: true,
    ads: false,
    prioritySupport: true,
    withdrawalAllowed: true,
    bulkTools: true,
    rewards: "PREMIUM"
  }
};

async function main() {
  try {
    console.log('Adding "config" column to "plans" table if not exists...');
    await prisma.$executeRaw`ALTER TABLE "plans" ADD COLUMN IF NOT EXISTS "config" JSONB;`;
    console.log('Column added successfully!');

    console.log('Updating plans default configs...');
    // We update basic plan
    await prisma.$executeRawUnsafe(
      `UPDATE "plans" SET "config" = $1::jsonb WHERE LOWER("id") = 'basic' AND "config" IS NULL;`,
      JSON.stringify(basicConfig)
    );
    // We update pro plan
    await prisma.$executeRawUnsafe(
      `UPDATE "plans" SET "config" = $1::jsonb WHERE LOWER("id") = 'pro' AND "config" IS NULL;`,
      JSON.stringify(proConfig)
    );
    // We update business plan
    await prisma.$executeRawUnsafe(
      `UPDATE "plans" SET "config" = $1::jsonb WHERE LOWER("id") = 'business' AND "config" IS NULL;`,
      JSON.stringify(businessConfig)
    );
    console.log('Defaults populated successfully!');

    console.log('Sending reload schema notification to PostgREST...');
    await prisma.$executeRawUnsafe("NOTIFY pgrst, 'reload schema';");
    console.log('PostgREST cache reloaded successfully!');
  } catch (err) {
    console.error('Error in migration script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
