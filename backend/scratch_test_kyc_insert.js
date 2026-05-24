const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching first user profile for mock KYC...');
    const profile = await prisma.profiles.findFirst();
    if (!profile) {
      console.log('No profiles found.');
      return;
    }
    console.log('Using profile user_id:', profile.user_id);

    console.log('\nAttempting mock insert into kyc_verifications...');
    const kyc = await prisma.kyc_verifications.create({
      data: {
        user_id: profile.user_id,
        aadhar_number: '123456789012',
        pan_number: 'ABCDE1234F',
        dob: new Date('1990-01-01'),
        gender: 'MALE',
        document_urls: {
          aadhar_front: 'mock/path/af.jpg',
          aadhar_back: 'mock/path/ab.jpg',
          pan_card: 'mock/path/pan.jpg',
          selfie: 'mock/path/selfie.jpg'
        },
        status: 'PENDING'
      }
    });
    console.log('✓ Successfully inserted mock KYC verification!', kyc);

    // Clean up
    console.log('\nCleaning up mock KYC verification...');
    await prisma.kyc_verifications.delete({
      where: { id: kyc.id }
    });
    console.log('✓ Cleanup complete.');

  } catch (err) {
    console.error('Prisma insert failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
