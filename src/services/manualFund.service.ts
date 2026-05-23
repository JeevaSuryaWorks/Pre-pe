import { supabase } from "@/integrations/supabase/client";

// Safe standard RFC4122 v4 UUID generator for client-side insertion compatibility
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const manualFundService = {
    /**
     * Submit a manual fund request for admin approval
     */
    async submitRequest(userId: string, amount: number, transactionId: string) {
        const { data, error } = await (supabase as any)
            .from('manual_fund_requests')
            .insert([
                {
                    id: generateUUID(),
                    user_id: userId,
                    amount: amount,
                    transaction_id: transactionId,
                    status: 'PENDING'
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get user's manual requests
     */
    async getUserRequests(userId: string) {
        const { data, error } = await (supabase as any)
            .from('manual_fund_requests')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
