import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Lock, 
  Unlock,
  History, 
  Search, 
  Download, 
  ChevronLeft, 
  Share2, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Coins
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { getWalletLedger, getWalletBalance } from '@/services/wallet.service';
import { format } from 'date-fns';
import { generateTransactionPDF, sharePDF } from '@/utils/pdfExport';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LedgerEntry {
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
    status?: string;
}

const LedgerPage = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [filteredLedger, setFilteredLedger] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    // Live wallet balance state
    const [walletBalance, setWalletBalance] = useState<{ balance: number; locked_balance: number } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadData = async (showSyncIndicator = false) => {
        if (!user) return;
        if (showSyncIndicator) setIsSyncing(true);
        else setIsLoading(true);

        try {
            // Parallel fetching of wallet balance and ledger entries to avoid bottlenecks
            const [balanceData, entries] = await Promise.all([
                getWalletBalance(user.id).catch(err => {
                    console.error('Error fetching balance:', err);
                    return null;
                }),
                getWalletLedger(user.id, 100).catch(err => {
                    console.error('Error fetching ledger:', err);
                    return [];
                })
            ]);

            setWalletBalance(balanceData);
            setLedger(entries as LedgerEntry[]);
            setFilteredLedger(entries as LedgerEntry[]);
        } catch (error) {
            console.error('Error loading ledger data:', error);
            toast({
                variant: "destructive",
                title: "Sync Error",
                description: "Failed to fetch updated ledger records."
            });
        } finally {
            setIsLoading(false);
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    useEffect(() => {
        let result = ledger;

        if (typeFilter !== 'ALL') {
            if (typeFilter === 'INFLOW') {
                result = result.filter(entry => ['CREDIT', 'REFUND', 'UNLOCK'].includes(entry.type));
            } else if (typeFilter === 'OUTFLOW') {
                result = result.filter(entry => ['DEBIT', 'LOCK'].includes(entry.type));
            } else {
                result = result.filter(entry => entry.type === typeFilter);
            }
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(entry =>
                entry.description.toLowerCase().includes(query) ||
                entry.id.toLowerCase().includes(query)
            );
        }

        setFilteredLedger(result);
    }, [ledger, searchQuery, typeFilter]);

    const handleCopyRef = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        toast({
            title: "Reference Copied",
            description: "Transaction ID copied to clipboard."
        });
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleExport = async (mode: 'download' | 'share') => {
        if (!user || filteredLedger.length === 0) return;

        try {
            const doc = await generateTransactionPDF(filteredLedger, {
                id: user.id,
                name: user.email?.split('@')[0],
                phone: user.phone
            }, "Wallet Activity Statement");

            if (mode === 'share') {
                const shared = await sharePDF(doc, `Prepe_Statement_${format(new Date(), 'yyyyMMdd')}.pdf`);
                if (shared) {
                    toast({ title: "Statement Shared", description: "Your PDF statement has been shared successfully." });
                }
            } else {
                doc.save(`Prepe_Statement_${format(new Date(), 'yyyyMMdd')}.pdf`);
                toast({ title: "Statement Downloaded", description: "Your account statement is ready." });
            }
        } catch (error) {
            console.error("Export error:", error);
            toast({ variant: "destructive", title: "Export Failed", description: "There was an error generating your PDF statement." });
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'CREDIT':
                return <ArrowDownLeft className="h-5 w-5 text-emerald-400" />;
            case 'DEBIT':
                return <ArrowUpRight className="h-5 w-5 text-rose-400" />;
            case 'LOCK':
                return <Lock className="h-5 w-5 text-amber-400" />;
            case 'UNLOCK':
                return <Unlock className="h-5 w-5 text-blue-400" />;
            case 'REFUND':
                return <ArrowDownLeft className="h-5 w-5 text-teal-400" />;
            default:
                return <History className="h-5 w-5 text-slate-400" />;
        }
    };

    const getTypeDetails = (type: string) => {
        switch (type) {
            case 'CREDIT':
                return {
                    label: 'Credit',
                    badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                    iconClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                };
            case 'DEBIT':
                return {
                    label: 'Debit',
                    badgeClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
                    iconClass: 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                };
            case 'LOCK':
                return {
                    label: 'Locked',
                    badgeClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
                    iconClass: 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                };
            case 'UNLOCK':
                return {
                    label: 'Unlocked',
                    badgeClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
                    iconClass: 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                };
            case 'REFUND':
                return {
                    label: 'Refund',
                    badgeClass: 'bg-teal-500/10 text-teal-400 border border-teal-500/20',
                    iconClass: 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                };
            default:
                return {
                    label: type,
                    badgeClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
                    iconClass: 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                };
        }
    };

    // Calculate dynamic view statistics based on current ledger list
    const stats = {
        totalCredits: filteredLedger
            .filter(entry => ['CREDIT', 'REFUND', 'UNLOCK'].includes(entry.type))
            .reduce((acc, entry) => acc + Number(entry.amount), 0),
        totalDebits: filteredLedger
            .filter(entry => ['DEBIT', 'LOCK'].includes(entry.type))
            .reduce((acc, entry) => acc + Number(entry.amount), 0)
    };

    if (loading) {
        return (
            <Layout>
                <div className="container py-8 flex flex-col items-center justify-center min-h-[60vh] gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-900" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">Establishing Secure Session...</p>
                </div>
            </Layout>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    const filterOptions = [
        { label: 'All History', value: 'ALL' },
        { label: 'Inflow (+)', value: 'INFLOW' },
        { label: 'Outflow (-)', value: 'OUTFLOW' },
        { label: 'Locked 🔒', value: 'LOCK' }
    ];

    return (
        <Layout title="Wallet Ledger">
            <div className="container py-6 pb-28 max-w-5xl mx-auto space-y-6">
                
                {/* Visual Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 -ml-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200/50" 
                            onClick={() => navigate(-1)}
                        >
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Wallet Ledger</h1>
                                <button 
                                    onClick={() => loadData(true)} 
                                    disabled={isSyncing}
                                    className="p-1 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                                    title="Sync Ledger"
                                >
                                    <RefreshCw className={cn("h-4.5 w-4.5", isSyncing && "animate-spin text-indigo-600")} />
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 font-medium">Digital asset ledger desk & statements</p>
                        </div>
                    </div>
                </div>

                {/* Premium Metrics Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Primary Wallet Balance Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-indigo-950 p-5 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-between min-h-[120px]">
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[45px] -mr-8 -mb-8"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <Coins className="h-3 w-3 text-indigo-400" />
                                Active Balance
                            </span>
                            {walletBalance && walletBalance.locked_balance > 0 && (
                                <Badge className="bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider gap-1">
                                    <Lock className="h-2 w-2" />
                                    ₹{walletBalance.locked_balance.toFixed(2)} Locked
                                </Badge>
                            )}
                        </div>
                        <div className="space-y-1 mt-4">
                            <h3 className="text-3xl font-black text-white tracking-tighter">
                                ₹{walletBalance ? walletBalance.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Available for recharges</p>
                        </div>
                    </div>

                    {/* Total Inflow Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 to-emerald-900 p-5 rounded-[2rem] border border-emerald-500/10 shadow-2xl flex flex-col justify-between min-h-[120px]">
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[45px] -mr-8 -mb-8"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <TrendingUp className="h-3 w-3 text-emerald-400" />
                                Total Inflow
                            </span>
                            <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg">
                                <Sparkles className="h-3 w-3 text-emerald-400" />
                            </div>
                        </div>
                        <div className="space-y-1 mt-4">
                            <h3 className="text-3xl font-black text-white tracking-tighter">
                                +₹{stats.totalCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[9px] text-emerald-300/60 font-bold uppercase tracking-wider">Credits & refunds inside view</p>
                        </div>
                    </div>

                    {/* Total Outflow Card */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-rose-950 to-rose-900 p-5 rounded-[2rem] border border-rose-500/10 shadow-2xl flex flex-col justify-between min-h-[120px]">
                        <div className="absolute right-0 bottom-0 w-32 h-32 bg-rose-500/10 rounded-full blur-[45px] -mr-8 -mb-8"></div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-rose-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <TrendingDown className="h-3 w-3 text-rose-400" />
                                Total Outflow
                            </span>
                            <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg">
                                <TrendingDown className="h-3 w-3 text-rose-400" />
                            </div>
                        </div>
                        <div className="space-y-1 mt-4">
                            <h3 className="text-3xl font-black text-white tracking-tighter">
                                -₹{stats.totalDebits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h3>
                            <p className="text-[9px] text-rose-300/60 font-bold uppercase tracking-wider">Debits & locks inside view</p>
                        </div>
                    </div>
                </div>

                {/* Filters Console */}
                <div className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search by description or transaction reference ID..."
                            className="pl-12 bg-slate-50/50 border-none shadow-inner rounded-2xl h-12 font-medium text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-100 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        {/* Segmented Pill Switcher Tabs */}
                        <div className="bg-slate-100/60 p-1 rounded-[1.5rem] flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                            {filterOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setTypeFilter(option.value)}
                                    className={cn(
                                        "px-4 py-2 rounded-[1.2rem] font-black text-[9px] uppercase tracking-wider transition-all whitespace-nowrap",
                                        typeFilter === option.value 
                                            ? "bg-slate-900 text-white shadow-md shadow-slate-950/20" 
                                            : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        {/* Statement Export Desk */}
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full gap-2 h-9 px-4 font-black text-[10px] uppercase tracking-wider bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                onClick={() => handleExport('download')}
                                disabled={filteredLedger.length === 0}
                            >
                                <Download className="h-3.5 w-3.5" />
                                Statement
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full gap-2 h-9 px-4 font-black text-[10px] uppercase tracking-wider bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                                onClick={() => handleExport('share')}
                                disabled={filteredLedger.length === 0}
                            >
                                <Share2 className="h-3.5 w-3.5" />
                                Share
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Staggered Timeline Ledger Feed */}
                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] animate-pulse">Reconciling ledger desk...</p>
                        </div>
                    ) : filteredLedger.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-20 border border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 space-y-4"
                        >
                            <div className="bg-white p-5 rounded-full w-fit mx-auto shadow-md">
                                <History className="h-8 w-8 text-slate-400" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No activities found</h3>
                                <p className="text-xs text-slate-400 font-medium">Verify your search parameter or select a different filter category.</p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="rounded-full font-black text-[10px] uppercase tracking-wider border-slate-200" 
                                onClick={() => { setSearchQuery(''); setTypeFilter('ALL'); }}
                            >
                                Reset Ledger Desk
                            </Button>
                        </motion.div>
                    ) : (
                        <div className="space-y-3.5">
                            <AnimatePresence mode="popLayout">
                                {filteredLedger.map((entry, index) => {
                                    const { label, badgeClass, iconClass } = getTypeDetails(entry.type);
                                    const isCreditFlow = ['CREDIT', 'REFUND', 'UNLOCK'].includes(entry.type);

                                    return (
                                        <motion.div
                                            key={entry.id}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -15 }}
                                            transition={{ delay: Math.min(index * 0.03, 0.3) }}
                                            className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-slate-900/10 hover:shadow-xl hover:shadow-slate-100/50 transition-all overflow-hidden flex flex-col"
                                        >
                                            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                {/* Left details & state icons */}
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className={cn("shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105", iconClass)}>
                                                        {getTypeIcon(entry.type)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="font-black text-slate-900 tracking-tight leading-tight group-hover:text-indigo-600 transition-colors">
                                                            {entry.description || 'Wallet Transaction'}
                                                        </h4>
                                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                                            <Badge className={cn("px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border-none scale-90 origin-left", badgeClass)}>
                                                                {label}
                                                            </Badge>
                                                            <span className="text-[10px] text-slate-400 font-bold whitespace-nowrap">
                                                                {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Right amount and balance after */}
                                                <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pl-16 sm:pl-0 sm:text-right border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0">
                                                    <div>
                                                        <p className={cn("text-xl font-black tracking-tighter leading-none", isCreditFlow ? "text-emerald-600" : "text-slate-950")}>
                                                            {isCreditFlow ? '+' : '-'}₹{entry.amount.toFixed(2)}
                                                        </p>
                                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-1.5">
                                                            Bal: ₹{entry.balance_after.toFixed(2)}
                                                        </p>
                                                    </div>

                                                    {/* Quick Copy Action */}
                                                    <div className="pl-3 border-l border-slate-100 flex flex-col items-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={(e) => handleCopyRef(e, entry.id)}
                                                            className={cn(
                                                                "h-9 w-9 rounded-full transition-all duration-200",
                                                                copiedId === entry.id ? "bg-emerald-50 text-emerald-500" : "text-slate-300 hover:bg-indigo-50 hover:text-indigo-600"
                                                            )}
                                                            title="Copy Ref ID"
                                                        >
                                                            {copiedId === entry.id ? (
                                                                <Check className="h-4 w-4" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Sub-strip detailing references */}
                                            <div className="px-5 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 font-mono">
                                                <span>REF ID: #{entry.id}</span>
                                                {entry.transaction_id && (
                                                    <span className="opacity-75">TXN: {entry.transaction_id.substring(0, 15)}...</span>
                                                )}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
};

export default LedgerPage;
