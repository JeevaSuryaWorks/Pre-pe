const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to create select/read policy on storage.buckets...');
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public select on storage buckets" 
      ON storage.buckets FOR SELECT 
      USING (true);
    `);
    console.log('Successfully created SELECT policy on storage.buckets!');
  } catch (err) {
    console.error('Error creating SELECT policy on buckets:', err.message);
  }

  try {
    console.log('Attempting to create wide-open policy on storage.buckets...');
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public all on storage buckets" 
      ON storage.buckets FOR ALL 
      USING (true)
      WITH CHECK (true);
    `);
    console.log('Successfully created ALL policy on storage.buckets!');
  } catch (err) {
    console.error('Error creating ALL policy on buckets:', err.message);
  }

  try {
    console.log('Let us check existing policies on storage.buckets...');
    const policies = await prisma.$queryRawUnsafe(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'buckets' AND schemaname = 'storage';
    `);
    console.log('Existing policies on storage.buckets:', JSON.stringify(policies, null, 2));
  } catch (err) {
    console.error('Error listing policies:', err.message);
  }

  await prisma.$disconnect();
}

main();
