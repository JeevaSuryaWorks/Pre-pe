import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    IndianRupee,
    Hash,
    CalendarClock,
    User,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    Search,
    Check,
    Mail,
    Phone,
    RefreshCw,
    AlertCircle,
    Calendar,
    ArrowUpRight,
    TrendingUp,
    Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FundRequest {
    id: string;
    user_id: string;
    amount: number;
    transaction_id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reject_reason: string | null;
    reviewed_at: string | null;
    created_at: string;
    profiles?: { full_name: string; email: string; phone: string } | null;
}

const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
};

const getAvatarDetails = (name: string) => {
    const clean = name.trim().replace(/\s+/g, ' ');
    const parts = clean.split(' ');
    let initials = 'U';
    if (parts.length > 0 && parts[0]) {
        initials = parts[0].charAt(0);
        if (parts.length > 1 && parts[1]) {
            initials += parts[1].charAt(0);
        }
    }
    initials = initials.toUpperCase().slice(0, 2);

    // Curated high-end color gradients for user initials
    const gradients = [
        'from-orange-500/20 to-amber-500/20 text-orange-600 border-orange-200/40',
        'from-emerald-500/20 to-teal-500/20 text-emerald-600 border-emerald-200/40',
        'from-blue-500/20 to-indigo-500/20 text-blue-600 border-blue-200/40',
        'from-purple-500/20 to-pink-500/20 text-purple-600 border-purple-200/40',
        'from-violet-500/20 to-fuchsia-500/20 text-violet-600 border-violet-200/40',
    ];
    
    // Deterministic selection based on name string hashing
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return { initials, cls: gradients[idx] };
};

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { cls: string; label: string }> = {
        PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200/60', label: 'Pending Verification' },
        APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', label: 'Direct Credited' },
        REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200/60', label: 'Rejected Claim' },
    };
    const s = map[status] || map.PENDING;
    return <Badge className={cn('text-[10px] font-black uppercase tracking-wider px-3 py-1 border rounded-xl select-none shadow-3xs', s.cls)}>{s.label}</Badge>;
};

export const AdminFundRequests = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null; userId: string | null; amount: number }>({ open: false, id: null, userId: null, amount: 0 });
    const [rejectReason, setRejectReason] = useState('');

    const { data: requests, isLoading } = useQuery<FundRequest[]>({
        queryKey: ['admin_fund_requests'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('manual_fund_requests')
                .select('*, profiles(full_name, email, phone)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        refetchInterval: 3000, // 3-second real-time auto-polling for instant admin responses
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, status, userId, amount, reason }: { id: string; status: string; userId: string; amount: number; reason?: string }) => {
            const { data: { user: adminUser } } = await supabase.auth.getUser();

            // 1. Update request status
            const { data: updatedRows, error: updErr } = await (supabase as any)
                .from('manual_fund_requests')
                .update({
                    status,
                    reject_reason: reason || null,
                    reviewed_by: adminUser?.id,
                    reviewed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select();

            if (updErr) throw updErr;
            if (!updatedRows || updatedRows.length === 0) throw new Error('Update blocked. Check admin RLS policies.');

            // 2. If approved, credit wallet
            if (status === 'APPROVED') {
                const { data: wallet, error: walletErr } = await (supabase as any)
                    .from('wallets')
                    .select('id, balance')
                    .eq('user_id', userId)
                    .single();

                if (walletErr) throw new Error('Wallet not found for this user.');

                const newBalance = Number(wallet.balance) + Number(amount);
                const { error: balErr } = await (supabase as any)
                    .from('wallets')
                    .update({ balance: newBalance, updated_at: new Date().toISOString() })
                    .eq('id', wallet.id);

                if (balErr) throw balErr;

                // Log entry inside wallet_ledger so transaction shows in the user's ledger list
                const { error: ledgerErr } = await (supabase as any)
                    .from('wallet_ledger')
                    .insert({
                        wallet_id: wallet.id,
                        type: 'CREDIT',
                        amount: Number(amount),
                        balance_after: newBalance,
                        description: `Direct UPI credit approved - UTR: ${updatedRows[0].transaction_id || ''}`,
                        created_at: new Date().toISOString()
                    });
                if (ledgerErr) console.warn('[AdminFundRequests] Ledger log failed:', ledgerErr.message);

                // Log main transaction
                const { error: txnErr } = await (supabase as any).from('transactions').insert({
                    user_id: userId,
                    type: 'CREDIT',
                    service_type: 'MANUAL_FUND',
                    description: 'Manual fund request approved by admin',
                    amount: Number(amount),
                    status: 'SUCCESS',
                    reference_id: `MFR-${id.slice(0, 8).toUpperCase()}`,
                    metadata: { fund_request_id: id, approved_by: adminUser?.id },
                });
                if (txnErr) console.warn('[AdminFundRequests] Transaction log failed:', txnErr.message);
            }
        },
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['admin_fund_requests'] });
            toast({
                title: vars.status === 'APPROVED' ? '✅ Request Approved' : '❌ Request Rejected',
                description: vars.status === 'APPROVED'
                    ? `₹${vars.amount} has been credited to the user's wallet.`
                    : 'The fund request has been rejected.',
            });
            setRejectDialog({ open: false, id: null, userId: null, amount: 0 });
            setRejectReason('');
        },
        onError: (err: any) => {
            toast({ title: 'Action Failed', description: err.message, variant: 'destructive' });
        },
    });

    const handleApprove = (req: FundRequest) => {
        updateMutation.mutate({ id: req.id, status: 'APPROVED', userId: req.user_id, amount: req.amount });
    };

    const handleReject = () => {
        if (!rejectDialog.id || !rejectDialog.userId) return;
        updateMutation.mutate({
            id: rejectDialog.id,
            status: 'REJECTED',
            userId: rejectDialog.userId,
            amount: rejectDialog.amount,
            reason: rejectReason || 'Rejected by admin',
        });
    };

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        toast({ title: 'UTR Copied', description: 'Transaction ID copied to clipboard' });
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Calculate dynamic stats from allRequests
    const allRequests = requests || [];
    const pendingRequests = allRequests.filter(r => r.status === 'PENDING');
    const approvedRequests = allRequests.filter(r => r.status === 'APPROVED');
    const rejectedRequests = allRequests.filter(r => r.status === 'REJECTED');

    const pendingCount = pendingRequests.length;
    const pendingVolume = pendingRequests.reduce((sum, r) => sum + Number(r.amount), 0);
    const approvedVolume = approvedRequests.reduce((sum, r) => sum + Number(r.amount), 0);

    // Calculate approved today volume
    const todayStr = new Date().toDateString();
    const approvedToday = approvedRequests.filter(r => {
        if (!r.reviewed_at) return false;
        return new Date(r.reviewed_at).toDateString() === todayStr;
    });
    const approvedTodayVolume = approvedToday.reduce((sum, r) => sum + Number(r.amount), 0);

    // Client-side instant filtering based on both active filter tab and search input query
    const filteredRequests = allRequests.filter(req => {
        if (filter !== 'ALL' && req.status !== filter) return false;
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const fullName = req.profiles?.full_name?.toLowerCase() || '';
            const email = req.profiles?.email?.toLowerCase() || '';
            const phone = req.profiles?.phone?.toLowerCase() || '';
            const utr = req.transaction_id?.toLowerCase() || '';
            const amountStr = req.amount?.toString() || '';
            
            return fullName.includes(query) || 
                   email.includes(query) || 
                   phone.includes(query) || 
                   utr.includes(query) || 
                   amountStr.includes(query);
        }
        return true;
    });

    return (
        <div className="max-w-5xl mx-auto px-4 pb-24 animate-in fade-in duration-500">
            {/* Header section with high-contrast executive presentation */}
            <div className="relative overflow-hidden bg-slate-900 text-white rounded-[32px] p-6 sm:p-10 mb-8 border border-slate-800 shadow-xl shadow-slate-950/20 select-none">
                <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FF671F]/10 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start md:items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-tr from-[#FF671F] via-[#FFFFFF]/80 to-[#046A38] rounded-2xl flex items-center justify-center shadow-lg shadow-black/30 shrink-0 p-0.5">
                            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                                <Wallet className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Fund Approve Desk</h1>
                                <span className="px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest text-emerald-400 rounded-full">Admin Core</span>
                            </div>
                            <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1">Verify direct UPI QR receipt UTR claims and credit wallets instantly.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-3 rounded-2xl backdrop-blur-md shadow-xl self-start md:self-auto shrink-0 select-none">
                        <div className="relative flex h-3 w-3 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                        </div>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-200">{pendingCount} Verification Needed</span>
                    </div>
                </div>
            </div>

            {/* Interactive Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Pending Stat Card */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    onClick={() => { setFilter('PENDING'); setSearchQuery(''); }}
                    className={cn(
                        "cursor-pointer bg-white/90 backdrop-blur-md border p-5 rounded-[28px] shadow-xs hover:shadow-md transition-all relative overflow-hidden select-none",
                        filter === 'PENDING' ? "border-amber-400 ring-2 ring-amber-400/20 bg-amber-50/20" : "border-slate-100 hover:border-amber-200"
                    )}
                >
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Action Required</p>
                            <h3 className="text-2xl font-black text-slate-800">{pendingCount} Claims</h3>
                            <p className="text-xs font-bold text-amber-600 mt-1 flex items-center gap-1">
                                <IndianRupee className="w-3 h-3 shrink-0" />
                                {pendingVolume.toLocaleString('en-IN')} pending
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500 shadow-3xs shrink-0">
                            <Clock className="w-4.5 h-4.5" />
                        </div>
                    </div>
                </motion.div>

                {/* Approved Volume Card */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    onClick={() => { setFilter('APPROVED'); setSearchQuery(''); }}
                    className={cn(
                        "cursor-pointer bg-white/90 backdrop-blur-md border p-5 rounded-[28px] shadow-xs hover:shadow-md transition-all relative overflow-hidden select-none",
                        filter === 'APPROVED' ? "border-emerald-400 ring-2 ring-emerald-400/20 bg-emerald-50/20" : "border-slate-100 hover:border-emerald-200"
                    )}
                >
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Approved Credits</p>
                            <h3 className="text-2xl font-black text-slate-800 flex items-center">
                                <IndianRupee className="w-4 h-4 shrink-0 -ml-1 text-emerald-600" />
                                {approvedVolume.toLocaleString('en-IN')}
                            </h3>
                            <p className="text-xs font-bold text-emerald-600 mt-1">
                                {approvedRequests.length} manual credits approved
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-3xs shrink-0">
                            <TrendingUp className="w-4.5 h-4.5" />
                        </div>
                    </div>
                </motion.div>

                {/* Processed Today Card */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className="bg-white/90 backdrop-blur-md border border-slate-100 p-5 rounded-[28px] shadow-xs relative overflow-hidden select-none hover:shadow-md transition-all"
                >
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Approved Today</p>
                            <h3 className="text-2xl font-black text-slate-800 flex items-center">
                                <IndianRupee className="w-4 h-4 shrink-0 -ml-1 text-blue-600" />
                                {approvedTodayVolume.toLocaleString('en-IN')}
                            </h3>
                            <p className="text-xs font-bold text-blue-600 mt-1 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                {approvedToday.length} logs approved today
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-650 shadow-3xs shrink-0">
                            <ArrowUpRight className="w-4.5 h-4.5" />
                        </div>
                    </div>
                </motion.div>

                {/* Rejections Card */}
                <motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    onClick={() => { setFilter('REJECTED'); setSearchQuery(''); }}
                    className={cn(
                        "cursor-pointer bg-white/90 backdrop-blur-md border p-5 rounded-[28px] shadow-xs hover:shadow-md transition-all relative overflow-hidden select-none",
                        filter === 'REJECTED' ? "border-rose-400 ring-2 ring-rose-400/20 bg-rose-50/20" : "border-slate-100 hover:border-rose-200"
                    )}
                >
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rejected Claims</p>
                            <h3 className="text-2xl font-black text-slate-800">{rejectedRequests.length} Claims</h3>
                            <p className="text-xs font-bold text-rose-600 mt-1">
                                Flags and UTR matching discrepancies
                            </p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 shadow-3xs shrink-0">
                            <XCircle className="w-4.5 h-4.5" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Premium Control Bar: Search and Dynamic Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-[28px] border border-slate-200/60 shadow-xs mb-8">
                {/* Unified Search Engine */}
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, email, phone, UTR or amount..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50/60 border border-slate-200/80 rounded-2xl py-3 pl-11 pr-10 text-sm font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF671F]/30 focus:border-[#FF671F] transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-3.5 p-0.5 rounded-full bg-slate-200/85 hover:bg-slate-350 text-slate-500 hover:text-slate-700 transition-colors"
                        >
                            <XCircle className="h-3.5 w-3.5 fill-slate-500 text-white" />
                        </button>
                    )}
                </div>

                {/* Pill Segmented Controller and Live Refresh indicator */}
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200/40">
                        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(tab => {
                            const isActive = filter === tab;
                            return (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={cn(
                                        'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 select-none',
                                        isActive 
                                            ? 'bg-slate-900 text-white shadow-md' 
                                            : 'text-slate-500 hover:text-slate-800'
                                    )}
                                >
                                    {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/50 px-3.5 py-2.5 rounded-2xl shadow-3xs select-none shrink-0">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Syncing Live</span>
                    </div>
                </div>
            </div>

            {/* Requests List Block */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="p-6 rounded-[28px] border border-slate-150 shadow-3xs space-y-4 bg-white/60 backdrop-blur-md">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-6 w-24" />
                                        <Skeleton className="h-4 w-36" />
                                    </div>
                                </div>
                                <Skeleton className="h-9 w-24 rounded-xl" />
                            </div>
                        </Card>
                    ))}
                </div>
            ) : !filteredRequests?.length ? (
                <Card className="p-16 text-center border-2 border-dashed border-slate-200 bg-white rounded-[36px] shadow-sm animate-in fade-in duration-300">
                    <div className="w-16 h-16 bg-emerald-50 rounded-[20px] flex items-center justify-center mx-auto mb-6 shadow-3xs border border-emerald-100 ring-8 ring-emerald-500/5">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="font-black text-xl text-slate-800 mb-1">Queue Clear</h3>
                    <p className="text-slate-500 text-sm font-medium">No manual fund requests match your selected filters.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredRequests.map((req) => {
                            const isExpanded = expanded === req.id;
                            const { initials, cls: avatarCls } = getAvatarDetails(req.profiles?.full_name || 'Unknown User');
                            
                            return (
                                <motion.div
                                    key={req.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    transition={{ duration: 0.25 }}
                                >
                                    <Card
                                        className={cn(
                                            'overflow-hidden border-2 transition-all duration-300 rounded-[28px] bg-white hover:shadow-lg hover:-translate-y-0.5',
                                            req.status === 'PENDING' 
                                                ? 'border-l-4 border-l-amber-500 border-slate-100 hover:border-amber-200' 
                                                : req.status === 'APPROVED'
                                                    ? 'border-l-4 border-l-emerald-600 border-slate-100 hover:border-emerald-250'
                                                    : 'border-l-4 border-l-rose-500 border-slate-100 hover:border-rose-250'
                                        )}
                                    >
                                        {/* Main Card Layout */}
                                        <div className="flex flex-col lg:flex-row lg:items-center p-6 gap-6 justify-between">
                                            
                                            {/* Section 1: Amount & User Avatar */}
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className={cn(
                                                    'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-3xs transition-colors',
                                                    req.status === 'APPROVED' 
                                                        ? 'bg-emerald-50/70 border-emerald-100/50' 
                                                        : req.status === 'REJECTED' 
                                                            ? 'bg-rose-50/70 border-rose-100/50' 
                                                            : 'bg-amber-50/70 border-amber-100/50'
                                                )}>
                                                    <IndianRupee className={cn(
                                                        'w-6 h-6',
                                                        req.status === 'APPROVED' ? 'text-emerald-600' : req.status === 'REJECTED' ? 'text-rose-500' : 'text-amber-600'
                                                    )} />
                                                </div>
                                                <div>
                                                    <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">₹{Number(req.amount).toLocaleString('en-IN')}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center font-bold text-[9px] border bg-gradient-to-tr shrink-0 select-none", avatarCls)}>
                                                            {initials}
                                                        </div>
                                                        <p className="text-xs text-slate-500 font-bold tracking-tight">
                                                            {req.profiles?.full_name || 'Unknown User'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Section 2: Metadata Grid */}
                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6">
                                                {/* UTR Copy Badge */}
                                                <div className="flex flex-col gap-1 w-full">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none leading-none mb-1">
                                                        <Hash className="w-3 h-3 text-[#FF671F]" /> UTR Transaction ID
                                                    </p>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-mono font-black text-slate-800 tracking-tight bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl select-all select-none shadow-3xs">
                                                            {req.transaction_id}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleCopy(req.id, req.transaction_id)}
                                                            className={cn(
                                                                "p-2 rounded-xl transition-all duration-300 select-none shadow-3xs border",
                                                                copiedId === req.id 
                                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-600 font-bold" 
                                                                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-600"
                                                            )}
                                                        >
                                                            {copiedId === req.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Time Submitted */}
                                                <div className="flex flex-col gap-1 w-full">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 select-none leading-none mb-1">
                                                        <CalendarClock className="w-3 h-3 text-[#046A38]" /> Submitted Time
                                                    </p>
                                                    <p className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-150 px-3 py-2 rounded-xl shadow-3xs self-start">
                                                        {formatDateTime(req.created_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Section 3: Status Badge / Action Buttons & Expanded Toggle */}
                                            <div className="flex items-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-5 lg:pt-0 lg:pl-6 w-full lg:w-auto justify-between lg:justify-end">
                                                {req.status === 'PENDING' ? (
                                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl h-11 px-5 shadow-sm active:scale-95 transition-all text-xs uppercase tracking-wider"
                                                            onClick={() => handleApprove(req)}
                                                            disabled={updateMutation.isPending}
                                                        >
                                                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve</>}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 sm:flex-none border-rose-200 text-rose-600 hover:bg-rose-50 font-black rounded-2xl h-11 px-5 active:scale-95 transition-all text-xs uppercase tracking-wider border-2"
                                                            onClick={() => setRejectDialog({ open: true, id: req.id, userId: req.user_id, amount: req.amount })}
                                                            disabled={updateMutation.isPending}
                                                        >
                                                            <XCircle className="w-4 h-4 mr-1.5" /> Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="shrink-0">
                                                        <StatusBadge status={req.status} />
                                                    </div>
                                                )}
                                                
                                                <button
                                                    onClick={() => setExpanded(isExpanded ? null : req.id)}
                                                    className={cn(
                                                        "p-2.5 rounded-xl hover:bg-slate-100 border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-600 transition-all duration-300 select-none ml-auto lg:ml-0",
                                                        isExpanded && "bg-slate-100 border-slate-200 text-slate-700"
                                                    )}
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Dropdown Detail Panel */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100 bg-slate-50/45 px-6 py-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-3xs">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest select-none leading-none">Email Address</p>
                                                        <a href={`mailto:${req.profiles?.email || ''}`} className="text-xs font-bold text-slate-800 hover:underline truncate block mt-1">
                                                            {req.profiles?.email || '—'}
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-3xs">
                                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                        <Phone className="w-4 h-4" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest select-none leading-none">Phone Number</p>
                                                        <a href={`tel:${req.profiles?.phone || ''}`} className="text-xs font-bold text-slate-800 hover:underline truncate block mt-1">
                                                            {req.profiles?.phone || '—'}
                                                        </a>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-3xs">
                                                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                                        <Hash className="w-4 h-4" />
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest select-none leading-none">Request UUID</p>
                                                        <p className="text-[10px] font-mono text-slate-500 truncate block select-all mt-1">{req.id}</p>
                                                    </div>
                                                </div>

                                                {req.reviewed_at && (
                                                    <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-3xs">
                                                        <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                                                            <Calendar className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest select-none leading-none">Reviewed At</p>
                                                            <p className="text-xs font-bold text-slate-700 mt-1">{formatDateTime(req.reviewed_at)}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                {req.reject_reason && (
                                                    <div className="sm:col-span-2 md:col-span-3 flex gap-3 bg-rose-50/50 p-4 rounded-2xl border border-rose-100/60 shadow-3xs">
                                                        <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200/50 flex items-center justify-center text-rose-600 shrink-0">
                                                            <AlertCircle className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest select-none leading-none">Rejection Reason</p>
                                                            <p className="text-xs text-rose-700 font-bold mt-1.5 leading-relaxed bg-white border border-rose-100/50 rounded-xl px-3.5 py-2.5">
                                                                {req.reject_reason}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Reject Reason dialog modal */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => {
                setRejectDialog(prev => ({ ...prev, open }));
                if (!open) setRejectReason('');
            }}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white animate-in zoom-in-95 duration-200">
                    <DialogHeader>
                        <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
                            <AlertTriangle className="w-7 h-7 text-rose-600" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Reject Fund Request</DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm font-medium pt-1">
                            This will reject the claims immediately. Please specify a clear rejection reason.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <textarea
                            className="w-full h-32 rounded-2xl border-2 border-slate-100 p-4 font-semibold text-slate-800 placeholder:text-slate-400 focus:border-rose-300 focus:outline-none transition-all resize-none text-sm leading-relaxed"
                            placeholder="e.g. Transaction UTR not found on our bank statements. Please verify and submit with correct receipt ID."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2.5 sm:gap-0 sm:flex-row flex-col">
                        <Button 
                            variant="ghost" 
                            className="rounded-2xl h-12 font-black text-xs uppercase tracking-wider text-slate-400 hover:bg-slate-50 select-none" 
                            onClick={() => setRejectDialog({ open: false, id: null, userId: null, amount: 0 })}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="rounded-2xl h-12 bg-rose-600 hover:bg-rose-700 text-white font-black px-8 shadow-lg shadow-rose-600/20 active:scale-95 transition-all text-xs uppercase tracking-wider select-none"
                            onClick={handleReject}
                            disabled={updateMutation.isPending}
                        >
                            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminFundRequests;
