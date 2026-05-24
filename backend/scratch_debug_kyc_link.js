const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const kycRecords = await prisma.kyc_verifications.findMany({
      take: 10
    });
    console.log('Total KYC records found:', kycRecords.length);
    
    const targetUserId = 'acf33ec9-61d5-4263-936e-5b3fb018cfac';
    console.log('\n--- Checking Target User in profiles table: ' + targetUserId);
    
    // Check in profiles by id
    const profileById = await prisma.profiles.findUnique({
      where: { id: targetUserId }
    });
    console.log('Profile by primary key (id):', profileById);

    // Check in profiles by user_id
    const profileByUserId = await prisma.profiles.findFirst({
      where: { user_id: targetUserId }
    });
    console.log('Profile by user_id column:', profileByUserId);
    
    // Fetch a list of some profiles to see structure
    const profiles = await prisma.profiles.findMany({
      take: 5
    });
    console.log('\nSample profiles in DB:', JSON.stringify(profiles, null, 2));

  } catch (err) {
    console.error('Error in main:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
