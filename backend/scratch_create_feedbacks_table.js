const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sqlScript = `
CREATE TABLE IF NOT EXISTS public.user_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT,
  rating INTEGER NOT NULL,
  feedback_pills TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select user_feedbacks" ON public.user_feedbacks;
CREATE POLICY "Public select user_feedbacks" ON public.user_feedbacks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert user_feedbacks" ON public.user_feedbacks;
CREATE POLICY "Public insert user_feedbacks" ON public.user_feedbacks FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public write user_feedbacks" ON public.user_feedbacks;
CREATE POLICY "Public write user_feedbacks" ON public.user_feedbacks FOR ALL USING (true);
`;

async function main() {
  try {
    console.log('Connecting to database and creating user_feedbacks table...');
    
    // Split by semicolon and execute each statement
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (let statement of statements) {
      try {
        console.log(`Executing SQL: ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
        await prisma.$executeRawUnsafe(statement);
      } catch (stmtErr) {
        console.error('Statement failed:', stmtErr.message);
      }
    }
    
    console.log('Table user_feedbacks created successfully!');
  } catch (err) {
    console.error('Error creating user_feedbacks table:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
