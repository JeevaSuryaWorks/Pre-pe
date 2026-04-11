import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  plan_type: string | null;
  whatsapp_consent: boolean | null;
  sim_provider: string | null;
  created_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data as unknown as UserProfile);
    }
    setLoading(false);
  };

  const channelRef = useRef<string>(`profiles_${user?.id}_${Math.random().toString(36).substring(7)}`);

  useEffect(() => {
    fetchProfile();

    if (user?.id) {
      const subscription = supabase
        .channel(channelRef.current)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, payload => {
          console.log("[useProfile] Profile updated, updating state...");
          setProfile(payload.new as UserProfile);
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user?.id]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return false;
    const { error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('user_id', user.id);
      
    if (!error) {
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return true;
    }
    return false;
  };

  return { profile, loading, updateProfile, refreshProfile: fetchProfile };
}
