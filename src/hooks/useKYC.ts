import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getKYCStatus } from '@/services/kyc.service';
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { decryptSensitiveData } from '@/lib/crypto';
import { useToast } from './use-toast';

// No module-level state needed for channels.

interface UseKYCOptions {
    onApproved?: () => void;
}

export const useKYC = (options?: UseKYCOptions) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const prevStatusRef = useRef<string | null>(null);

    const { data: kycData, isLoading, isFetching, error, refetch } = useQuery({
        queryKey: ['kycStatus', user?.id],
        queryFn: async () => {
            if (!user) return null;
            const data = await getKYCStatus(user.id) as any;
            if (!data) return null;

            // Decrypt numbers for convenience if data exists
            try {
                const [pan, aadhar] = await Promise.all([
                    decryptSensitiveData(data.pan_number),
                    decryptSensitiveData(data.aadhar_number)
                ]);
                return { ...data, decrypted_pan: pan, decrypted_aadhar: aadhar };
            } catch (err) {
                console.warn("[useKYC] Failed to decrypt data:", err);
                return data;
            }
        },
        enabled: !!user,
        staleTime: 0,
    });

    const status = kycData?.status || null; // 'APPROVED' | 'PENDING' | 'REJECTED' | null

    // Notify on approval and navigate
    useEffect(() => {
        if (prevStatusRef.current === 'PENDING' && status === 'APPROVED') {
            toast({
                title: "KYC Approved! 🎉",
                description: "Your account is now verified. You can now add up to ₹6,000 to your wallet and access full services.",
            });
            // Fire callback if provided (used for navigation)
            if (options?.onApproved) {
                options.onApproved();
            }
        }
        prevStatusRef.current = status;
    }, [status, toast, options?.onApproved]);

    // REAL-TIME: Listen for changes to current user's KYC record
    useEffect(() => {
        if (!user?.id) return;

        // Use a unique channel name per component instance to avoid unmount clashes
        const uniqueTopic = `kyc_status_${user.id}_${Math.random().toString(36).substring(7)}`;

        const channel = supabase
            .channel(uniqueTopic)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'kyc_verifications',
                    filter: `user_id=eq.${user.id}`
                },
                () => {
                    console.log('[useKYC] State change detected, refetching...');
                    refetch();
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`[useKYC] Successfully subscribed to ${uniqueTopic}`);
                }
            });

        return () => {
            // Let Supabase handle the channel cleanup safely without crashing the WebSocket
            supabase.removeChannel(channel);
        };
    }, [user?.id, refetch]);

    const isApproved = status === 'APPROVED';
    const isPending = status === 'PENDING';
    const isRejected = status === 'REJECTED';

    console.log('[useKYC] Hook State:', { userId: user?.id, status, isLoading, kycData });

    return {
        kycData,
        status,
        isApproved,
        isPending,
        isRejected,
        // isInitialLoading: ONLY true when we are literally waiting for the first piece of data.
        // It stays true if we have a user but haven't fetched their specific record yet.
        isInitialLoading: !!user && (isLoading || (kycData === undefined && !isFetching && !error)),
        // isLoading: broader status including background refetches
        isLoading: !!user && (isLoading || isFetching || (kycData === undefined && !error)),
        error,
        refetch
    };
};
