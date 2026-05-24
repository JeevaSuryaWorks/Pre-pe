const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Fetching first profile...');
    const firstProfile = await prisma.profiles.findFirst();
    if (!firstProfile) {
      console.log('No profiles found in database.');
      return;
    }
    console.log('Found profile:', {
      id: firstProfile.id,
      user_id: firstProfile.user_id,
      email: firstProfile.email,
      whatsapp_consent: firstProfile.whatsapp_consent
    });

    console.log('\nSimulating upsert on profiles table (similar to supabase JS client)...');
    // Using prisma raw execution to simulate the exact ON CONFLICT query that Supabase uses
    const result = await prisma.$executeRawUnsafe(`
      INSERT INTO public.profiles (user_id, whatsapp_consent)
      VALUES ('${firstProfile.user_id}'::uuid, true)
      ON CONFLICT (user_id)
      DO UPDATE SET whatsapp_consent = EXCLUDED.whatsapp_consent;
    `);
    
    console.log('Upsert command run successfully! Result code:', result);

    const updatedProfile = await prisma.profiles.findUnique({
      where: { user_id: firstProfile.user_id }
    });
    console.log('Updated Profile in Database:', {
      id: updatedProfile.id,
      user_id: updatedProfile.user_id,
      whatsapp_consent: updatedProfile.whatsapp_consent
    });

  } catch (err) {
    console.error('Upsert simulation failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
