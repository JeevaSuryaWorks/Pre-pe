import { supabase } from '@/integrations/supabase/client';

export type SavedItemCategory = 'FAVORITE' | 'CIRCLE';

export interface SavedItem {
  id: string;
  user_id: string;
  category: SavedItemCategory;
  title: string;
  service_type: string;
  account_id: string;
  operator_name?: string;
  metadata?: any;
  created_at: string;
}

export const getSavedItems = async (userId: string): Promise<SavedItem[]> => {
  const { data, error } = await supabase
    .from('saved_items' as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saved items:', error);
    return [];
  }

  return data as unknown as SavedItem[];
};

export const addSavedItem = async (item: Omit<SavedItem, 'id' | 'created_at'>): Promise<SavedItem | null> => {
  const { data, error } = await supabase
    .from('saved_items' as any)
    .insert([item])
    .select()
    .single();

  if (error) {
    console.error('Error adding saved item:', error);
    return null;
  }

  return data as unknown as SavedItem;
};

export const removeSavedItem = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_items' as any)
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error removing saved item:', error);
    return false;
  }

  return true;
};

export const checkIsFavorite = async (userId: string, transactionId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('saved_items' as any)
      .select('id')
      .eq('user_id', userId)
      .eq('category', 'FAVORITE')
      .eq('metadata->transaction_id', transactionId)
      .maybeSingle();
  
    if (error) return null;
    return (data as any)?.id || null;
};
