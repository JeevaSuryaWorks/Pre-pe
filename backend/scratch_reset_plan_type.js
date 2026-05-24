const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Resetting plan_type to NULL for test user Lerini9210@nuitx.com...');
    
    const result = await prisma.profiles.updateMany({
      where: {
        OR: [
          { user_id: 'eab2d7d1-ed17-47af-a558-7c7c74820c1f' },
          { email: { equals: 'lerini9210@nuitx.com', mode: 'insensitive' } },
          { email: { equals: 'prepe.test.kyc.user@example.com', mode: 'insensitive' } }
        ]
      },
      data: {
        plan_type: null
      }
    });
    
    console.log(`Successfully reset plan_type to NULL for ${result.count} test profile(s).`);

    const profiles = await prisma.profiles.findMany({
      where: {
        OR: [
          { user_id: 'eab2d7d1-ed17-47af-a558-7c7c74820c1f' },
          { email: { equals: 'lerini9210@nuitx.com', mode: 'insensitive' } },
          { email: { equals: 'prepe.test.kyc.user@example.com', mode: 'insensitive' } }
        ]
      }
    });
    console.log('Current status of test profiles:');
    console.log(profiles.map(p => ({
      email: p.email,
      plan_type: p.plan_type,
      whatsapp_consent: p.whatsapp_consent
    })));

  } catch (err) {
    console.error('Error resetting plan_type:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
