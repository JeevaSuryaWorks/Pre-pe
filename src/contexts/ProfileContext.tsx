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
    console.log("[ProfileContext] Fetching profile for user_id:", user.id);
    
    try {
      // 1. Fetch the basic profile cleanly without any broken joins
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error("[ProfileContext] Error fetching profile:", profileError);
        setProfile(null);
      } else if (profileData) {
        const joinedProfile = { ...profileData } as any;

        // 2. Fetch the plan details separately to prevent join errors due to schema relationship constraints
        if (profileData.plan_type) {
          try {
            const { data: planData, error: planError } = await supabase
              .from('plans')
              .select('*')
              .eq('id', profileData.plan_type.toUpperCase())
              .maybeSingle();
            
            if (!planError && planData) {
              joinedProfile.plans = planData;
            }
          } catch (planErr) {
            console.warn("[ProfileContext] Failed to load separate plan details:", planErr);
          }
        }

        console.log("[ProfileContext] Profile successfully loaded:", joinedProfile);
        setProfile(joinedProfile as UserProfile);
      } else {
        console.warn("[ProfileContext] No profile found in DB for user:", user.id);
        setProfile(null);
      }
    } catch (err) {
      console.error("[ProfileContext] Unexpected error during fetch:", err);
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
    // Use upsert to ensure the profile exists even if signup trigger failed
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ 
        user_id: user.id,
        ...updates 
      } as any, { 
        onConflict: 'user_id' 
      })
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
