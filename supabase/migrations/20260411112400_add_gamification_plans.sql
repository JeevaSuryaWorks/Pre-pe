-- Add plan_type and whatsapp_consent to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type VARCHAR(20) DEFAULT 'BASIC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_consent BOOLEAN DEFAULT NULL;

-- Create reward_points_ledger table
CREATE TABLE public.reward_points_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  points INTEGER NOT NULL,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('SIGNUP', 'FIRST_RECHARGE', 'REFERRAL', 'SPIN_WHEEL', 'GAME', 'FAMILY_MEMBER', 'CASHBACK_POINTS', 'MANUAL')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Note: user_id references profiles(user_id) because profiles.user_id is the primary uuid from auth.users

-- Create scratch_cards table
CREATE TABLE public.scratch_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('GIFT_VOUCHER', 'REWARD_POINTS', 'CASHBACK')),
  status VARCHAR(20) NOT NULL DEFAULT 'LOCKED' CHECK (status IN ('LOCKED', 'UNLOCKED', 'SCRATCHED')),
  title TEXT NOT NULL,
  description TEXT,
  reward_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
  min_recharge_threshold DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create index for performance
CREATE INDEX idx_reward_points_ledger_user_id ON public.reward_points_ledger(user_id);
CREATE INDEX idx_scratch_cards_user_id ON public.scratch_cards(user_id);

-- Enable RLS
ALTER TABLE public.reward_points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scratch_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reward_points_ledger
CREATE POLICY "Users can view own reward points" ON public.reward_points_ledger
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert reward points" ON public.reward_points_ledger
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for scratch_cards
CREATE POLICY "Users can view own scratch cards" ON public.scratch_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own scratch cards (status)" ON public.scratch_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert scratch cards" ON public.scratch_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update timestamps on scratch_cards
CREATE TRIGGER update_scratch_cards_updated_at
  BEFORE UPDATE ON public.scratch_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
