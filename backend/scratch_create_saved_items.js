const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Attempting to create saved_items table in Supabase PostgreSQL...');
    
    // Create the table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS public.saved_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
          category TEXT NOT NULL CHECK (category IN ('FAVORITE', 'CIRCLE')),
          title TEXT NOT NULL,
          service_type TEXT NOT NULL,
          account_id TEXT NOT NULL,
          operator_name TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
      );
    `);
    console.log('saved_items table created.');

    // Enable RLS
    await prisma.$executeRawUnsafe(`
      ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
    `);
    console.log('RLS enabled on saved_items.');

    // Create policies
    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can view their own saved items" ON public.saved_items;`);
      await prisma.$executeRawUnsafe(`CREATE POLICY "Users can view their own saved items" ON public.saved_items FOR SELECT USING (auth.uid() = user_id);`);
      console.log('View policy created.');
    } catch (e) { console.error('Error creating view policy:', e.message); }

    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can insert their own saved items" ON public.saved_items;`);
      await prisma.$executeRawUnsafe(`CREATE POLICY "Users can insert their own saved items" ON public.saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);`);
      console.log('Insert policy created.');
    } catch (e) { console.error('Error creating insert policy:', e.message); }

    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can update their own saved items" ON public.saved_items;`);
      await prisma.$executeRawUnsafe(`CREATE POLICY "Users can update their own saved items" ON public.saved_items FOR UPDATE USING (auth.uid() = user_id);`);
      console.log('Update policy created.');
    } catch (e) { console.error('Error creating update policy:', e.message); }

    try {
      await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can delete their own saved items" ON public.saved_items;`);
      await prisma.$executeRawUnsafe(`CREATE POLICY "Users can delete their own saved items" ON public.saved_items FOR DELETE USING (auth.uid() = user_id);`);
      console.log('Delete policy created.');
    } catch (e) { console.error('Error creating delete policy:', e.message); }

    // Create Index
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS saved_items_user_id_idx ON public.saved_items(user_id);
    `);
    console.log('Index created on saved_items(user_id).');

    // Reload PostgREST schema cache
    await prisma.$executeRawUnsafe(`
      NOTIFY pgrst, 'reload schema';
    `);
    console.log('PostgREST schema cache reload notified successfully!');
    
  } catch (err) {
    console.error('Error in schema migration script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
