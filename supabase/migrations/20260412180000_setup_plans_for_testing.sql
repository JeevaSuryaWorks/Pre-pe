-- 1. Create plans table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price TEXT,           -- Display price like "₹499/mo"
  price_amount NUMERIC NOT NULL DEFAULT 0, -- Numeric price for Razorpay
  features JSONB DEFAULT '[]'::jsonb,
  is_popular BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fix: Convert features column to jsonb if it exists as text[]
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'plans' 
          AND column_name = 'features' 
          AND data_type = 'ARRAY'
    ) THEN
        -- Drop the old default first to avoid casting errors
        ALTER TABLE public.plans ALTER COLUMN features DROP DEFAULT;
        
        -- Convert the type
        ALTER TABLE public.plans 
        ALTER COLUMN features TYPE jsonb 
        USING to_jsonb(features);
        
        -- Set the new jsonb default
        ALTER TABLE public.plans ALTER COLUMN features SET DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 2. Populate test plans
INSERT INTO public.plans (id, name, subtitle, description, price, price_amount, features, is_popular, order_index)
VALUES 
('BASIC', 'Basic Plan', 'For individuals', 'Basic features for personal use', 'Free', 0, '["Up to 5 recharges/day", "₹500 daily wallet add limit", "Ad-supported"]'::jsonb, false, 0),
('PRO', 'Pro Plan', 'Power user', 'Advanced features for frequent users', '₹499/mo', 499, '["Unlimited recharges", "₹10,000 daily wallet add limit", "Ad-free experience", "Priority support", "Premium rewards"]'::jsonb, true, 1),
('BUSINESS', 'Business Plan', 'Scaling up', 'Full suite for business growth', '₹999/mo', 999, '["Unlimited everything", "BNPL up to ₹3,000", "Bulk management tools", "Dedicated account manager"]'::jsonb, false, 2)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  price_amount = EXCLUDED.price_amount,
  features = EXCLUDED.features,
  is_popular = EXCLUDED.is_popular,
  order_index = EXCLUDED.order_index;

-- 3. Create plan_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.plan_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  plan_id TEXT REFERENCES public.plans(id),
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_payments ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DROP POLICY IF EXISTS "Anyone can view plans" ON public.plans;
CREATE POLICY "Anyone can view plans" ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own payments" ON public.plan_payments;
CREATE POLICY "Users can view own payments" ON public.plan_payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 6. Trigger for updated_at
DROP TRIGGER IF EXISTS update_plans_updated_at ON public.plans;
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_plan_payments_updated_at ON public.plan_payments;
CREATE TRIGGER update_plan_payments_updated_at
  BEFORE UPDATE ON public.plan_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
