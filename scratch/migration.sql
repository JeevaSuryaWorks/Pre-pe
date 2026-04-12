-- 1. Ensure columns exist in profiles table
-- If they already exist, this won't cause errors.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'plan_type') THEN
        ALTER TABLE public.profiles ADD COLUMN plan_type TEXT REFERENCES public.plans(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'whatsapp_consent') THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp_consent BOOLEAN DEFAULT NULL;
    END IF;
END $$;

-- 2. Ensure RLS is enabled on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing update policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 4. Create proper update policy that allows self-updates
-- This is often the cause of the 'stuck on onboarding' bug
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 5. Ensure users can SELECT their own profile (usually already there, but good to be certain)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 6. Verify plans table has rows (optional but helpful)
-- If plans table is empty, onboarding will show no plans.
-- Ensure we have at least the basic IDs.
INSERT INTO public.plans (id, name, order_index, description, features)
VALUES 
('BASIC', 'Basic', 0, 'Essential features for personal use', ARRAY['Basic Recharges', 'Standard Commission']),
('PRO', 'Pro', 1, 'Advanced features for frequent users', ARRAY['High Limits', 'Priority Support', 'Exclusive Offers']),
('BUSINESS', 'Business', 21, 'Full platform access for business', ARRAY['Bulk Recharges', 'Max Commission', 'API Access'])
ON CONFLICT (id) DO NOTHING;
