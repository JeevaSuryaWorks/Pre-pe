const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- Step 1: Checking and Creating kyc-documents bucket ---');
    await prisma.$executeRawUnsafe(`
      INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
      VALUES ('kyc-documents', 'kyc-documents', true, 5242880, NULL)
      ON CONFLICT (id) DO UPDATE 
      SET public = true;
    `);
    console.log('✓ kyc-documents bucket verified/created successfully!');

    console.log('\n--- Step 2: Listing all buckets in storage.buckets ---');
    const buckets = await prisma.$queryRawUnsafe(`
      SELECT id, name, public FROM storage.buckets;
    `);
    console.table(buckets);

    console.log('\n--- Step 3: Dropping conflicting policies on storage.objects ---');
    const policiesToDrop = [
      'Allow public read on storage objects',
      'Allow public insert on storage objects',
      'Allow public update on storage objects',
      'Allow public delete on storage objects',
      'Allow authenticated uploads',
      'Allow authenticated selects',
      'Allow authenticated updates',
      'Allow authenticated deletes'
    ];

    for (const policy of policiesToDrop) {
      try {
        await prisma.$executeRawUnsafe(`
          DROP POLICY IF EXISTS "${policy}" ON storage.objects;
        `);
      } catch (e) {
        // Ignore
      }
    }
    console.log('✓ Dropped old policies.');

    console.log('\n--- Step 4: Creating wide-open policies on storage.objects ---');
    
    console.log('Creating SELECT policy...');
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public read on storage objects" 
      ON storage.objects FOR SELECT 
      USING (true);
    `);

    console.log('Creating INSERT policy...');
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public insert on storage objects" 
      ON storage.objects FOR INSERT 
      WITH CHECK (true);
    `);

    console.log('Creating UPDATE policy...');
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public update on storage objects" 
      ON storage.objects FOR UPDATE 
      USING (true) 
      WITH CHECK (true);
    `);

    console.log('Creating DELETE policy...');
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Allow public delete on storage objects" 
      ON storage.objects FOR DELETE 
      USING (true);
    `);

    console.log('✓ Wide-open storage.objects policies created successfully!');

    console.log('\n--- Step 5: Verification of storage.objects policies ---');
    const objectPolicies = await prisma.$queryRawUnsafe(`
      SELECT schemaname, tablename, policyname, permissive, cmd 
      FROM pg_policies 
      WHERE tablename = 'objects' AND schemaname = 'storage';
    `);
    console.table(objectPolicies);

  } catch (err) {
    console.error('Critical error in storage setup:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
