const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const sqlScript = `
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price TEXT,
  price_amount NUMERIC NOT NULL DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  config JSONB,
  is_popular BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select plans" ON public.plans;
CREATE POLICY "Public select plans" ON public.plans FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write plans" ON public.plans;
CREATE POLICY "Public write plans" ON public.plans FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.banners (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  tag TEXT,
  cta_text TEXT,
  cta_link TEXT,
  grad_from TEXT,
  grad_to TEXT,
  icon_name TEXT,
  status TEXT DEFAULT 'draft',
  type TEXT DEFAULT 'banner',
  style TEXT DEFAULT 'card',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select banners" ON public.banners;
CREATE POLICY "Public select banners" ON public.banners FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write banners" ON public.banners;
CREATE POLICY "Public write banners" ON public.banners FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.rewards_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  reward_points INTEGER DEFAULT 0,
  icon_name TEXT,
  requirement_type TEXT,
  requirement_value NUMERIC DEFAULT 0,
  button_text TEXT,
  target_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rewards_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select rewards_tasks" ON public.rewards_tasks;
CREATE POLICY "Public select rewards_tasks" ON public.rewards_tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write rewards_tasks" ON public.rewards_tasks;
CREATE POLICY "Public write rewards_tasks" ON public.rewards_tasks FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.reward_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reward_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select reward_settings" ON public.reward_settings;
CREATE POLICY "Public select reward_settings" ON public.reward_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write reward_settings" ON public.reward_settings;
CREATE POLICY "Public write reward_settings" ON public.reward_settings FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.gift_vouchers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  provider TEXT,
  amount NUMERIC NOT NULL,
  price NUMERIC,
  discount NUMERIC,
  code TEXT,
  "bannerUrl" TEXT,
  banner_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.gift_vouchers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select gift_vouchers" ON public.gift_vouchers;
CREATE POLICY "Public select gift_vouchers" ON public.gift_vouchers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write gift_vouchers" ON public.gift_vouchers;
CREATE POLICY "Public write gift_vouchers" ON public.gift_vouchers FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.user_completed_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  earned_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_completed_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public select user_completed_tasks" ON public.user_completed_tasks;
CREATE POLICY "Public select user_completed_tasks" ON public.user_completed_tasks FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public write user_completed_tasks" ON public.user_completed_tasks;
CREATE POLICY "Public write user_completed_tasks" ON public.user_completed_tasks FOR ALL USING (true);
`;

async function main() {
  try {
    console.log('Connecting to database and creating missing tables (clean script)...');
    
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
    
    console.log('Tables created and policies set successfully!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
