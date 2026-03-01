import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
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

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, { cls: string; label: string }> = {
        PENDING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Pending' },
        APPROVED: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Approved' },
        REJECTED: { cls: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Rejected' },
    };
    const s = map[status] || map.PENDING;
    return <Badge className={cn('text-xs font-bold px-3 py-1 border rounded-full', s.cls)}>{s.label}</Badge>;
};

export const AdminFundRequests = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string | null; userId: string | null; amount: number }>({ open: false, id: null, userId: null, amount: 0 });
    const [rejectReason, setRejectReason] = useState('');

    const { data: requests, isLoading } = useQuery<FundRequest[]>({
        queryKey: ['admin_fund_requests', filter],
        queryFn: async () => {
            let q = (supabase as any)
                .from('manual_fund_requests')
                .select('*, profiles(full_name, email, phone)')
                .order('created_at', { ascending: false });

            if (filter !== 'ALL') q = q.eq('status', filter);
            const { data, error } = await q;
            if (error) throw error;
            return data || [];
        },
        refetchInterval: 30000,
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

                // Log transaction — use real column names
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

    const pendingCount = requests?.filter(r => r.status === 'PENDING').length ?? 0;

    return (
        <div className="max-w-5xl mx-auto px-4 pb-12">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-blue-600 rounded-lg">
                            <Wallet className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fund Requests</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Review and approve manual wallet top-up requests.</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-slate-700">{pendingCount} Pending</span>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
                {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={cn(
                            'px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200',
                            filter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        )}
                    >
                        {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                    </button>
                ))}
            </div>

            {/* List */}
            {isLoading ? (
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-3xl" />)}
                </div>
            ) : !requests?.length ? (
                <Card className="p-20 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-3xl">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="font-bold text-2xl text-slate-800 mb-2">All Clear</h3>
                    <p className="text-slate-500">No {filter !== 'ALL' ? filter.toLowerCase() : ''} fund requests at this time.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requests.map((req) => {
                        const isExpanded = expanded === req.id;
                        return (
                            <Card
                                key={req.id}
                                className={cn(
                                    'overflow-hidden border transition-all duration-300 rounded-3xl bg-white',
                                    req.status === 'PENDING' ? 'border-amber-200 shadow-amber-100/50 shadow-md' : 'border-slate-100 shadow-sm'
                                )}
                            >
                                {/* Main Row */}
                                <div className="flex flex-col md:flex-row md:items-center p-5 gap-4">
                                    {/* Amount */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={cn(
                                            'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                                            req.status === 'APPROVED' ? 'bg-emerald-50' : req.status === 'REJECTED' ? 'bg-rose-50' : 'bg-amber-50'
                                        )}>
                                            <IndianRupee className={cn(
                                                'w-7 h-7',
                                                req.status === 'APPROVED' ? 'text-emerald-600' : req.status === 'REJECTED' ? 'text-rose-500' : 'text-amber-600'
                                            )} />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-black text-slate-900">₹{Number(req.amount).toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                                                <User className="w-3 h-3" />
                                                {req.profiles?.full_name || 'Unknown User'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Middle Info */}
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <Hash className="w-2.5 h-2.5" /> Transaction ID
                                            </p>
                                            <p className="text-sm font-mono font-bold text-slate-800 truncate">{req.transaction_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                <CalendarClock className="w-2.5 h-2.5" /> Submitted
                                            </p>
                                            <p className="text-xs font-semibold text-slate-700">{formatDateTime(req.created_at)}</p>
                                        </div>
                                    </div>

                                    {/* Status + Actions */}
                                    <div className="flex items-center gap-3 shrink-0">
                                        <StatusBadge status={req.status} />
                                        {req.status === 'PENDING' && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl h-9 px-4 shadow-sm"
                                                    onClick={() => handleApprove(req)}
                                                    disabled={updateMutation.isPending}
                                                >
                                                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-1" /> Approve</>}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-xl h-9 px-4"
                                                    onClick={() => setRejectDialog({ open: true, id: req.id, userId: req.user_id, amount: req.amount })}
                                                    disabled={updateMutation.isPending}
                                                >
                                                    <XCircle className="w-4 h-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                        <button
                                            onClick={() => setExpanded(isExpanded ? null : req.id)}
                                            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                                        >
                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">User Email</p>
                                            <p className="text-sm font-semibold text-slate-700">{req.profiles?.email || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                                            <p className="text-sm font-semibold text-slate-700">{req.profiles?.phone || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Request ID</p>
                                            <p className="text-xs font-mono text-slate-500">{req.id}</p>
                                        </div>
                                        {req.reviewed_at && (
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reviewed At</p>
                                                <p className="text-sm font-semibold text-slate-700">{formatDateTime(req.reviewed_at)}</p>
                                            </div>
                                        )}
                                        {req.reject_reason && (
                                            <div className="md:col-span-2">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rejection Reason</p>
                                                <p className="text-sm text-rose-600 font-semibold">{req.reject_reason}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Reject Dialog */}
            <Dialog open={rejectDialog.open} onOpenChange={(open) => {
                setRejectDialog(prev => ({ ...prev, open }));
                if (!open) setRejectReason('');
            }}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-3">
                            <AlertTriangle className="w-6 h-6 text-rose-600" />
                        </div>
                        <DialogTitle className="text-xl font-black text-slate-900">Reject Fund Request</DialogTitle>
                        <DialogDescription className="text-slate-500">
                            This will notify the user. Provide a reason so they can resubmit correctly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <textarea
                            className="w-full h-28 rounded-2xl border-2 border-slate-100 p-4 font-medium text-slate-800 placeholder:text-slate-400 focus:border-rose-300 focus:outline-none transition-all resize-none text-sm"
                            placeholder="e.g. Transaction ID not found or amount does not match..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" className="rounded-xl font-bold text-slate-500" onClick={() => setRejectDialog({ open: false, id: null, userId: null, amount: 0 })}>
                            Cancel
                        </Button>
                        <Button
                            className="rounded-xl bg-rose-600 text-white font-bold px-8 hover:bg-rose-700 shadow-lg shadow-rose-600/20"
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
