import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  plans?: {
    config: any;
    name: string;
    features: string[];
  };
}

interface ProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<string>(`profiles_global_${user?.id}_${Math.random().toString(36).substring(7)}`);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("[ProfileContext] Fetching profile for:", user.id);
    
    try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, plans:plan_type(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
            console.error("[ProfileContext] Fetch error:", error);
        } else if (data) {
            console.log("[ProfileContext] Profile loaded:", data);
            setProfile(data as unknown as UserProfile);
        } else {
            console.warn("[ProfileContext] No profile found in DB for user:", user.id);
        }
    } catch (err) {
        console.error("[ProfileContext] Critical fetch error:", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();

    if (user?.id) {
      const subscription = supabase
        .channel(channelRef.current)
        .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'profiles', 
            filter: `user_id=eq.${user.id}` 
        }, payload => {
          console.log("[ProfileContext] Real-time UPDATE received:", payload.new);
          // MERGE with existing profile to avoid losing the joined 'plans' data
          setProfile(prev => {
              if (prev && prev.user_id === payload.new.user_id) {
                  return { ...prev, ...payload.new };
              }
              return payload.new as UserProfile;
          });
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user?.id]);

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return false;
    
    console.log("[ProfileContext] Updating profile with:", updates);
    
    // We use .select() to verify the update actually hit a row (RLS check)
    const { data, error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('user_id', user.id)
      .select();
      
    if (error) {
        console.error("[ProfileContext] Update error:", error);
        return false;
    }

    if (!data || data.length === 0) {
        console.error("[ProfileContext] Update failed: No rows affected. Check RLS policies.");
        return false;
    }

    // Success - update local state immediately
    setProfile(prev => prev ? { ...prev, ...updates } : data[0] as unknown as UserProfile);
    return true;
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, refreshProfile: fetchProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
