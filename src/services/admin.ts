import { supabase } from "@/integrations/supabase/client";
import { TransactionStatus } from "@/types/recharge.types";

export interface AdminAction {
    type: 'REFUND' | 'CREDIT' | 'DEBIT' | 'BLOCK' | 'UNBLOCK';
    targetId: string;
    amount?: number;
    reason: string;
}

export interface MockUser {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone: string;
    plan_type: 'BASIC' | 'PRO' | 'BUSINESS';
    custom_spin_limit: number | null;
    kyc_status: 'APPROVED' | 'PENDING' | 'NOT SUBMITTED' | null;
    created_at: string;
    wallets: {
        balance: number;
        locked_balance: number;
    };
}

const defaultUsers: MockUser[] = [
    {
        id: "usr-01",
        user_id: "usr-01",
        full_name: "Jeeva Surya",
        email: "jeeva@prepe.in",
        phone: "+91 9876543210",
        plan_type: "BUSINESS",
        custom_spin_limit: null,
        kyc_status: "APPROVED",
        created_at: "2026-05-01T10:00:00Z",
        wallets: { balance: 24500, locked_balance: 500 }
    },
    {
        id: "usr-02",
        user_id: "usr-02",
        full_name: "Rya Dev",
        email: "rya@gmail.com",
        phone: "+91 8765432109",
        plan_type: "PRO",
        custom_spin_limit: 5,
        kyc_status: "APPROVED",
        created_at: "2026-05-10T12:30:00Z",
        wallets: { balance: 1250, locked_balance: 0 }
    },
    {
        id: "usr-03",
        user_id: "usr-03",
        full_name: "Sunil Kumar",
        email: "sunil@yahoo.com",
        phone: "+91 7654321098",
        plan_type: "BASIC",
        custom_spin_limit: null,
        kyc_status: "PENDING",
        created_at: "2026-05-15T08:15:00Z",
        wallets: { balance: 75, locked_balance: 0 }
    },
    {
        id: "usr-04",
        user_id: "usr-04",
        full_name: "Priya Sharma",
        email: "priya@prepe.in",
        phone: "+91 9988776655",
        plan_type: "BASIC",
        custom_spin_limit: 10,
        kyc_status: null,
        created_at: "2026-05-18T14:45:00Z",
        wallets: { balance: 3200, locked_balance: 150 }
    }
];

export const adminService = {
    // User Management
    async getUsers(page = 1, limit = 20, search?: string, planType?: string) {
        let query = supabase
            .from('profiles')
            .select(`
                id,
                user_id,
                full_name,
                email,
                phone,
                plan_type,
                custom_spin_limit,
                created_at,
                wallets (
                    balance,
                    locked_balance
                ),
                kyc_verifications (
                    status
                )
            `, { count: 'exact' });

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        if (planType) {
            query = query.eq('plan_type', planType);
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range((page - 1) * limit, page * limit - 1);

        if (error) throw error;

        // Map profiles to MockUser shape
        const mappedUsers: MockUser[] = (data || []).map((p: any) => {
            let wallet = { balance: 0, locked_balance: 0 };
            if (p.wallets) {
                if (Array.isArray(p.wallets)) {
                    if (p.wallets.length > 0) {
                        wallet = p.wallets[0];
                    }
                } else if (typeof p.wallets === 'object') {
                    wallet = p.wallets;
                }
            }
            
            let kyc = null;
            if (p.kyc_verifications) {
                if (Array.isArray(p.kyc_verifications)) {
                    if (p.kyc_verifications.length > 0) {
                        kyc = p.kyc_verifications[0];
                    }
                } else if (typeof p.kyc_verifications === 'object') {
                    kyc = p.kyc_verifications;
                }
            }

            return {
                id: p.id,
                user_id: p.user_id,
                full_name: p.full_name || 'No Name',
                email: p.email || '',
                phone: p.phone || '',
                plan_type: (p.plan_type || 'BASIC').toUpperCase() as any,
                custom_spin_limit: p.custom_spin_limit,
                kyc_status: kyc ? kyc.status : 'NOT SUBMITTED',
                created_at: p.created_at,
                wallets: {
                    balance: Number(wallet.balance),
                    locked_balance: Number(wallet.locked_balance)
                }
            };
        });

        return { data: mappedUsers, count: count || 0 };
    },

    async toggleUserStatus(userId: string, isActive: boolean) {
        console.log("Toggle user status placeholders", userId, isActive);
    },

    async updateProfile(userId: string, updates: any) {
        const mappedUpdates: any = { ...updates };
        if (mappedUpdates.plan_type) {
            mappedUpdates.plan_type = mappedUpdates.plan_type.toUpperCase();
        }

        const { error } = await supabase
            .from('profiles')
            .update(mappedUpdates)
            .eq('user_id', userId);

        if (error) throw error;
        window.dispatchEvent(new Event('prepe_users_updated'));
        return true;
    },

    // Wallet Adjustments
    async adjustWallet(userId: string, type: 'CREDIT' | 'DEBIT', amount: number, reason: string) {
        // 1. Fetch user wallet balance
        const { data: wallet, error: walletError } = await supabase
            .from('wallets')
            .select('id, balance')
            .eq('user_id', userId)
            .maybeSingle();

        if (walletError || !wallet) throw new Error("Wallet not found for this user");

        const prevBalance = Number(wallet.balance);
        const newBalance = type === 'CREDIT' 
            ? prevBalance + amount 
            : prevBalance - amount;

        if (newBalance < 0) throw new Error("Insufficient balance for debit");

        // 2. Update wallet balance
        const { error: updateError } = await supabase
            .from('wallets')
            .update({ 
                balance: newBalance,
                updated_at: new Date().toISOString()
            })
            .eq('id', wallet.id);

        if (updateError) throw updateError;

        // 3. Create wallet ledger entry
        const { error: ledgerError } = await supabase
            .from('wallet_ledger')
            .insert({
                wallet_id: wallet.id,
                type: type === 'CREDIT' ? 'CREDIT' : 'DEBIT',
                amount: amount,
                balance_after: newBalance,
                description: reason
            });

        if (ledgerError) console.error("Failed to insert wallet ledger:", ledgerError);

        // 4. Create admin audit log
        const { data: adminUser } = await supabase.auth.getUser();
        const { error: auditError } = await supabase
            .from('admin_audit_logs')
            .insert({
                admin_id: adminUser.user?.id || userId, 
                action_type: 'WALLET_ADJUSTMENT',
                target_id: userId,
                details: { 
                    type, 
                    amount, 
                    reason, 
                    previous_balance: prevBalance, 
                    new_balance: newBalance 
                }
            });

        if (auditError) console.error("Failed to insert admin audit log:", auditError);

        window.dispatchEvent(new Event('prepe_users_updated'));
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
        const { data, error } = await supabase
            .from('plans' as never)
            .select('*')
            .order('order_index', { ascending: true });

        if (error) {
            console.error("Failed to load plans from Supabase:", error);
            let local = localStorage.getItem('prepe_plans');
            return local ? JSON.parse(local) : [];
        }

        return (data || []).map((plan: any) => {
            const id = plan.id.toLowerCase();
            const isGold = id === 'gold';
            const isPremium = id === 'premium';
            
            return {
                id: plan.id,
                name: plan.name,
                subtitle: plan.subtitle,
                description: plan.description,
                price: plan.price,
                price_amount: Number(plan.price_amount),
                features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]'),
                is_popular: plan.is_popular,
                order_index: plan.order_index,
                config: {
                    dailyRechargeLimit: isPremium ? 9999 : (isGold ? 25 : 5),
                    dailyWalletAddLimit: isPremium ? 50000 : (isGold ? 5000 : 500),
                    maxWalletBalance: isPremium ? 200000 : (isGold ? 20000 : 2000),
                    bnplLimit: isPremium ? 5000 : (isGold ? 1000 : 0),
                    bnplCycleDays: isPremium ? 30 : (isGold ? 15 : 0),
                    features: {
                        bnpl: isPremium || isGold,
                        cashback: isPremium || isGold,
                        ads: true,
                        prioritySupport: isPremium || isGold,
                        bulkTools: isPremium,
                        rewards: plan.id.toUpperCase()
                    }
                }
            };
        });
    },

    async updatePlan(id: string, updates: any) {
        const { config, features, ...dbUpdates } = updates;
        
        if (features !== undefined) {
            dbUpdates.features = features;
        }

        const { error } = await supabase
            .from('plans' as never)
            .update(dbUpdates)
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Reward Settings Management
    async getRewardSettings() {
        const { data, error } = await supabase
            .from('reward_settings' as never)
            .select('*');

        if (error) {
            console.error("Failed to load reward settings from Supabase, returning local store:", error);
            let local = localStorage.getItem('prepe_reward_settings');
            const parsed = local ? JSON.parse(local) : [];
            return parsed.reduce((acc: any, item: any) => {
                acc[item.key] = item.value;
                return acc;
            }, {});
        }

        return (data || []).reduce((acc: any, item: any) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
    },

    async updateRewardSetting(key: string, value: any) {
        const { error } = await supabase
            .from('reward_settings' as never)
            .upsert({ key, value, updated_at: new Date().toISOString() });

        if (error) throw error;
        return true;
    },

    // Task Management
    async getTasks() {
        const { data, error } = await supabase
            .from('rewards_tasks' as never)
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Failed to fetch rewards_tasks from Supabase:", error);
            let local = localStorage.getItem('prepe_rewards_tasks');
            return local ? JSON.parse(local) : [];
        }

        return data || [];
    },

    async upsertTask(task: any) {
        const taskWithId = {
            ...task,
            id: task.id || 'task_' + Math.random().toString(36).substr(2, 9),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('rewards_tasks' as never)
            .upsert(taskWithId);

        if (error) throw error;
        return taskWithId;
    },

    async deleteTask(id: string) {
        const { error } = await supabase
            .from('rewards_tasks' as never)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Banner Management
    async getBanners(type?: 'banner' | 'announcement', status?: 'draft' | 'published') {
        let query = supabase
            .from('banners' as never)
            .select('*')
            .order('sort_order', { ascending: true });

        if (type) {
            query = query.eq('type', type);
        }
        if (status) {
            query = query.eq('status', status);
        }

        const { data, error } = await query;
        if (error) {
            console.error("Failed to query banners from Supabase:", error);
            let local = localStorage.getItem('prepe_banners');
            const list = local ? JSON.parse(local) : [];
            let filtered = list;
            if (type) filtered = filtered.filter((b: any) => b.type === type);
            if (status) filtered = filtered.filter((b: any) => b.status === status);
            return filtered.sort((a: any, b: any) => (a.sort_order ?? 99) - (b.sort_order ?? 99));
        }

        return data || [];
    },

    async getBannerById(id: string) {
        const { data, error } = await supabase
            .from('banners' as never)
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async upsertBanner(banner: any) {
        const bannerWithId = {
            ...banner,
            id: banner.id || 'banner_' + Math.random().toString(36).substr(2, 9),
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('banners' as never)
            .upsert(bannerWithId);

        if (error) throw error;
        window.dispatchEvent(new Event('prepe_banners_updated'));
        return bannerWithId;
    },

    async deleteBanner(id: string) {
        const { error } = await supabase
            .from('banners' as never)
            .delete()
            .eq('id', id);

        if (error) throw error;
        window.dispatchEvent(new Event('prepe_banners_updated'));
        return true;
    },

    async toggleBannerPublish(id: string) {
        const { data: current, error: getError } = await supabase
            .from('banners' as never)
            .select('status')
            .eq('id', id)
            .single();

        if (getError || !current) throw new Error("Banner not found");

        const newStatus = current.status === 'published' ? 'draft' : 'published';

        const { data, error } = await supabase
            .from('banners' as never)
            .update({ 
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        window.dispatchEvent(new Event('prepe_banners_updated'));
        return data;
    },

    async reorderBanners(id1: string, sortOrder1: number, id2: string, sortOrder2: number) {
        const p1 = supabase
            .from('banners' as never)
            .update({ sort_order: sortOrder2, updated_at: new Date().toISOString() })
            .eq('id', id1);

        const p2 = supabase
            .from('banners' as never)
            .update({ sort_order: sortOrder1, updated_at: new Date().toISOString() })
            .eq('id', id2);

        const [r1, r2] = await Promise.all([p1, p2]);

        if (r1.error) throw r1.error;
        if (r2.error) throw r2.error;

        window.dispatchEvent(new Event('prepe_banners_updated'));
        return true;
    }
};
