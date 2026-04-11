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

-- RLS
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own saved items') THEN
        CREATE POLICY "Users can view their own saved items" ON public.saved_items FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own saved items') THEN
        CREATE POLICY "Users can insert their own saved items" ON public.saved_items FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own saved items') THEN
        CREATE POLICY "Users can update their own saved items" ON public.saved_items FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own saved items') THEN
        CREATE POLICY "Users can delete their own saved items" ON public.saved_items FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS saved_items_user_id_idx ON public.saved_items(user_id);
