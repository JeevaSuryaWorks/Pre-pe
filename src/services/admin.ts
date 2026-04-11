import { supabase } from "@/integrations/supabase/client";
import { TransactionStatus } from "@/types/recharge.types";

export interface AdminAction {
    type: 'REFUND' | 'CREDIT' | 'DEBIT' | 'BLOCK' | 'UNBLOCK';
    targetId: string;
    amount?: number;
    reason: string;
}

export const adminService = {
    // User Management
    async getUsers(page = 1, limit = 20, search?: string, planType?: string) {
        // 1. Fetch Profiles
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        if (planType) {
            query = (query as any).eq('plan_type', planType);
        }

        const { data: profiles, error: profilesError, count } = await query;
        if (profilesError) throw profilesError;

        if (!profiles || profiles.length === 0) {
            return { data: [], count: 0 };
        }

        const userIds = profiles.map(p => p.user_id);

        // 2. Fetch Wallets manually
        const { data: wallets, error: walletsError } = await supabase
            .from('wallets')
            .select('user_id, balance, locked_balance')
            .in('user_id', userIds);

        if (walletsError) console.error("Error fetching wallets:", walletsError);

        // 3. Fetch KYC Status
        const { data: kycRecords, error: kycError } = await (supabase as any)
            .from('kyc_verifications')
            .select('user_id, status')
            .in('user_id', userIds);

        if (kycError) console.error("Error fetching KYC status:", kycError);

        // 4. Merge
        const data = profiles.map(p => {
            const wallet = wallets?.find(w => w.user_id === p.user_id);
            const kyc = kycRecords?.find((k: any) => k.user_id === p.user_id);
            return {
                ...p,
                wallets: wallet || { balance: 0, locked_balance: 0 },
                kyc_status: kyc?.status || null
            };
        });

        return { data, count };
    },

    async toggleUserStatus(userId: string, isActive: boolean) {
        // Note: 'is_active' column might need to be added to profiles or auth.users meta
        // For now, we simulate this or check if column exists.
        // Assuming profiles has 'is_active' or similar. 
        // If not, we might need to add it to migration. 
        // Let's assume we use 'metadata' or strict role management.
        console.log("Toggle user status placeholders", userId, isActive);
        // Real impl: await supabase.auth.admin.updateUserById(userId, { user_metadata: { is_active: isActive } });
    },

    // Wallet Adjustments
    async adjustWallet(userId: string, type: 'CREDIT' | 'DEBIT', amount: number, reason: string) {
        // 1. Get Wallet ID
        const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', userId).single();
        if (!wallet) throw new Error("Wallet not found");

        const newBalance = type === 'CREDIT'
            ? wallet.balance + amount
            : wallet.balance - amount;

        if (newBalance < 0) throw new Error("Insufficient balance for debit");

        // 2. Perform Atomic Update (RPC is better, but client-side transaction simulation here)
        // We update wallet balance
        const { error: walletError } = await supabase
            .from('wallets')
            .update({ balance: newBalance })
            .eq('id', wallet.id);

        if (walletError) throw walletError;

        // 3. Log Transaction
        await supabase.from('wallet_ledger').insert({
            wallet_id: wallet.id,
            type: type,
            amount: amount,
            balance_after: newBalance,
            description: `Admin Adjustment: ${reason}`
        });

        // 4. Log Audit
        const user = await supabase.auth.getUser();
        await supabase.from('admin_audit_logs').insert({
            admin_id: user.data.user?.id || '',
            action_type: 'WALLET_ADJUSTMENT',
            target_id: userId,
            details: { type, amount, reason, previous_balance: wallet.balance }
        });

        return { success: true, newBalance };
    },

    // Transaction Monitoring
    async getTransactions(status?: TransactionStatus) {
        const query = supabase
            .from('transactions')
            .select('*')
            .order('created_at', { ascending: false });

        if (status) {
            query.eq('status', status);
        }

        return await query;
    },

    async refundTransaction(transactionId: string, reason: string) {
        // 1. Fetch Transaction
        const { data: txn } = await supabase.from('transactions').select('*').eq('id', transactionId).single();
        if (!txn) throw new Error("Transaction not found");
        if (txn.status === 'REFUNDED') throw new Error("Already refunded");

        // 2. Credit Wallet
        const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', txn.user_id).single();
        if (!wallet) throw new Error("User wallet not found");

        const refundAmount = txn.amount; // Full refund
        const newBalance = wallet.balance + refundAmount;

        await supabase.from('wallets').update({ balance: newBalance }).eq('id', wallet.id);

        // 3. Update Transaction Status
        await supabase.from('transactions').update({ status: 'REFUNDED', metadata: { refund_reason: reason } }).eq('id', transactionId);

        // 4. Ledger Entry
        await supabase.from('wallet_ledger').insert({
            wallet_id: wallet.id,
            type: 'REFUND',
            transaction_id: transactionId,
            amount: refundAmount,
            balance_after: newBalance,
            description: `Refund for TXN #${txn.id}: ${reason}`
        });

        // 5. Audit Log
        const user = await supabase.auth.getUser();
        await supabase.from('admin_audit_logs').insert({
            admin_id: user.data.user?.id || '',
            action_type: 'REFUND',
            target_id: transactionId,
            details: { amount: refundAmount, reason }
        });
    },

    async getPendingKYCCount() {
        const { count, error } = await (supabase as any)
            .from('kyc_verifications')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING');

        if (error) throw error;
        return count || 0;
    },

    async getPendingManualFundCount() {
        const { count, error } = await (supabase as any)
            .from('manual_fund_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PENDING');

        if (error) throw error;
        return count || 0;
    },

    // Plan Management
    async getPlans() {
        const { data, error } = await (supabase as any)
            .from('plans')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        return data || [];
    },

    async updatePlan(id: string, updates: any) {
        const { error } = await (supabase as any)
            .from('plans')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
};
