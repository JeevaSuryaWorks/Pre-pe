import { useProfile } from './useProfile';
import { getPlanLimits, PlanLimits } from '@/config/planLimits';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function usePlanLimits() {
    const { user } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const limits = getPlanLimits(profile?.plan_type);

    const checkRechargeLimit = async () => {
        if (!user) return { allowed: false, count: 0, limit: 0 };
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', today.toISOString())
            .in('type', ['MOBILE_RECHARGE', 'DTH_RECHARGE', 'BILL_PAYMENT']);

        if (error) return { allowed: true, count: 0, limit: limits.dailyRechargeLimit };

        const currentCount = count || 0;
        return {
            allowed: currentCount < limits.dailyRechargeLimit,
            count: currentCount,
            limit: limits.dailyRechargeLimit
        };
    };

    const checkWalletAddLimit = async (amount: number) => {
        if (!user) return { allowed: false, current: 0, limit: 0 };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Sum up wallet topups today from transactions
        const { data, error } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', user.id)
            .eq('type', 'WALLET_TOPUP')
            .eq('status', 'SUCCESS')
            .gte('created_at', today.toISOString());

        if (error) return { allowed: true, current: 0, limit: limits.dailyWalletAddLimit };

        const currentTotal = data?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
        
        return {
            allowed: (currentTotal + amount) <= limits.dailyWalletAddLimit,
            current: currentTotal,
            limit: limits.dailyWalletAddLimit
        };
    };

    const checkWalletMaxBalance = (currentBalance: number, amountToAdd: number) => {
        return (currentBalance + amountToAdd) <= limits.maxWalletBalance;
    };

    const isFeatureEnabled = (feature: keyof PlanLimits['features']) => {
        return limits.features[feature];
    };

    return {
        limits,
        loading: profileLoading,
        checkRechargeLimit,
        checkWalletAddLimit,
        checkWalletMaxBalance,
        isFeatureEnabled,
        planId: profile?.plan_type || 'BASIC'
    };
}
