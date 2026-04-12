-- 1. Create Wallets Table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0.00,
    locked_balance DECIMAL(12,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Create Wallet Ledger Table
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    transaction_id UUID,
    type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT', 'LOCK', 'UNLOCK', 'REFUND')),
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_points_ledger ENABLE ROW LEVEL SECURITY;

-- 4. Fix Event Type Constraint on Ledger
ALTER TABLE public.reward_points_ledger 
DROP CONSTRAINT IF EXISTS reward_points_ledger_event_type_check;

ALTER TABLE public.reward_points_ledger 
ADD CONSTRAINT reward_points_ledger_event_type_check 
CHECK (event_type IN ('SIGNUP', 'FIRST_RECHARGE', 'REFERRAL', 'SPIN_WHEEL', 'GAME', 'FAMILY_MEMBER', 'CASHBACK_POINTS', 'MANUAL', 'REDEEM'));

-- 5. RLS Policies for Reward Points Ledger
DROP POLICY IF EXISTS "Users can insert their own points" ON public.reward_points_ledger;
CREATE POLICY "Users can insert their own points" ON public.reward_points_ledger
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own points" ON public.reward_points_ledger;
CREATE POLICY "Users can view their own points" ON public.reward_points_ledger
    FOR SELECT USING (auth.uid() = user_id);

-- 5. RLS Policies for Wallets
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
CREATE POLICY "Users can view their own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wallet balance" ON public.wallets;
CREATE POLICY "Users can update their own wallet balance" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. RLS Policies for Wallet Ledger
DROP POLICY IF EXISTS "Users can view their own wallet ledger" ON public.wallet_ledger;
CREATE POLICY "Users can view their own wallet ledger" ON public.wallet_ledger
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wallets
            WHERE wallets.id = wallet_ledger.wallet_id
            AND wallets.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own wallet ledger" ON public.wallet_ledger;
CREATE POLICY "Users can insert their own wallet ledger" ON public.wallet_ledger
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wallets
            WHERE wallets.id = wallet_ledger.wallet_id
            AND wallets.user_id = auth.uid()
        )
    );

-- 7. Automatic Wallet Creation Trigger
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.wallets (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_wallet ON auth.users;
CREATE TRIGGER on_auth_user_created_wallet
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_wallet();

-- 8. Create wallets for existing users
INSERT INTO public.wallets (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
