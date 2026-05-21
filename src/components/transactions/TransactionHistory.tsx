import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Calendar as CalendarIcon, 
  Loader2, 
  History, 
  Smartphone, 
  Tv, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  SlidersHorizontal,
  Heart,
  Download,
  Share2,
  ChevronRight,
  Sparkles,
  TrendingDown,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getTransactionHistory } from '@/services/recharge.service';
import { format } from 'date-fns';
import type { Transaction } from '@/types/recharge.types';
import { addSavedItem, removeSavedItem, getSavedItems } from '@/services/saved.service';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const normalizeTransactionStatus = (status?: string): 'SUCCESS' | 'FAILED' | 'PENDING' => {
  if (!status) return 'PENDING';
  const normalized = status.toUpperCase();
  if (normalized === 'SUCCESS' || normalized === 'SUCCESSFUL') {
    return 'SUCCESS';
  }
  if (
    normalized === 'FAILED' || 
    normalized === 'FAILURE' || 
    normalized === 'FAIL' || 
    normalized === 'REJECTED' || 
    normalized === 'CANCELLED' || 
    normalized === 'ERROR'
  ) {
    return 'FAILED';
  }
  return 'PENDING';
};

export function TransactionHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Recharges');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPreset, setFilterPreset] = useState('Recent');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const [favorites, setFavorites] = useState<Record<string, string | null>>({});
  const [favLoading, setFavLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadTransactions = async () => {
      if (user) {
        setLoading(true);
        try {
          // Fetch transactions and saved items in parallel to optimize load times
          const [txns, savedItems] = await Promise.all([
            getTransactionHistory(user.id, 100).catch(err => {
              console.error('Error fetching transactions:', err);
              return [] as Transaction[];
            }),
            getSavedItems(user.id).catch(err => {
              console.error('Error fetching saved items:', err);
              return [];
            })
          ]);
          
          setTransactions(txns);
          
          // Map favorite item IDs to their corresponding transaction IDs
          const favStatus: Record<string, string | null> = {};
          for (const item of savedItems) {
            if (item.category === 'FAVORITE' && item.metadata?.transaction_id) {
              favStatus[item.metadata.transaction_id] = item.id;
            }
          }
          setFavorites(favStatus);
        } catch (error) {
          console.error('Failed to load transaction history:', error);
          toast({
            variant: "destructive",
            title: "Loading Warning",
            description: "Failed to fully synchronize favorites. Offline mode active."
          });
        } finally {
          setLoading(false);
        }
      }
    };
    loadTransactions();
  }, [user]);

  const handleToggleFavorite = async (e: React.MouseEvent, tx: Transaction) => {
    e.stopPropagation();
    if (!user || favLoading[tx.id]) return;

    const currentFavId = favorites[tx.id];
    setFavLoading(prev => ({ ...prev, [tx.id]: true }));

    try {
      if (currentFavId) {
        const success = await removeSavedItem(currentFavId);
        if (success) {
          setFavorites(prev => ({ ...prev, [tx.id]: null }));
          toast({ 
            title: "Removed from Favorites", 
            description: "Successfully unsaved the transaction." 
          });
        }
      } else {
        const newItem = await addSavedItem({
          user_id: user.id,
          category: 'FAVORITE',
          title: `${tx.operator_name || 'Recharge'} - ${tx.mobile_number || tx.dth_id || 'N/A'}`,
          service_type: tx.service_type,
          account_id: tx.mobile_number || tx.dth_id || 'N/A',
          operator_name: tx.operator_name || undefined,
          metadata: { transaction_id: tx.id, amount: tx.amount }
        });
        
        if (newItem) {
          setFavorites(prev => ({ ...prev, [tx.id]: newItem.id }));
          toast({ 
            title: "Saved to Favorites", 
            description: "Quick-access shortcut created in your Favorites desk." 
          });
        }
      }
    } catch (error) {
      console.error('Failed to toggle favorite status:', error);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not modify saved item status. Try again later."
      });
    } finally {
      setFavLoading(prev => ({ ...prev, [tx.id]: false }));
    }
  };

  const getServiceIcon = (tx: Transaction) => {
    const operator = tx.operator_name?.toLowerCase() || '';
    let logoPath = '';
    
    if (operator.includes('jio')) logoPath = '/operators/jio.svg';
    else if (operator.includes('airtel') && (tx.service_type === 'DTH' || operator.includes('dth'))) logoPath = '/operators/airtel-dth.svg';
    else if (operator.includes('airtel')) logoPath = '/operators/airtel.svg';
    else if (operator.includes('vi') || operator.includes('vodafone') || operator.includes('idea')) logoPath = '/operators/vi.svg';
    else if (operator.includes('bsnl')) logoPath = '/operators/bsnl.svg';
    else if (operator.includes('tata') || operator.includes('tataplay') || operator.includes('sky')) logoPath = '/operators/tataplay.svg';
    else if (operator.includes('dish')) logoPath = '/operators/dishtv.svg';
    else if (operator.includes('sun')) logoPath = '/operators/sun-direct.svg';
    else if (operator.includes('videocon') || operator.includes('d2h')) logoPath = '/operators/videocon-d2h.svg';

    if (logoPath) {
      return (
        <div className="w-12 h-12 p-1.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/60 rounded-2xl flex items-center justify-center shadow-md">
          <img src={logoPath} alt={tx.operator_name || 'operator'} className="w-full h-full object-contain" />
        </div>
      );
    }
    
    switch (tx.service_type) {
      case 'MOBILE_PREPAID': 
        return <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center"><Smartphone className="h-6 w-6" /></div>;
      case 'DTH': 
        return <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center"><Tv className="h-6 w-6" /></div>;
      case 'MOBILE_POSTPAID': 
        return <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center"><FileText className="h-6 w-6" /></div>;
      default: 
        return <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 flex items-center justify-center"><History className="h-6 w-6" /></div>;
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const query = searchQuery.toLowerCase();
    const date = new Date(tx.created_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tab Filter
    if (activeTab === 'Recharges' && !['RECHARGE', 'BILL_PAYMENT'].includes(tx.type)) return false;
    if (activeTab === 'Deposits' && tx.type !== 'WALLET_CREDIT') return false;
    if (activeTab === 'Referrals' && !tx.metadata?.is_referral && !tx.metadata?.description?.toString().toLowerCase().includes('referral')) return false;
    if (activeTab === 'Cashbacks' && (!tx.commission || tx.commission <= 0)) return false;

    // Preset Filter
    if (filterPreset === 'Today' && date < today) return false;

    // Search Filter
    const matchesSearch =
      tx.id.toLowerCase().includes(query) ||
      (tx.mobile_number && tx.mobile_number.includes(query)) ||
      (tx.dth_id && tx.dth_id.includes(query)) ||
      (tx.operator_name && tx.operator_name.toLowerCase().includes(query));

    // Date Range Filter
    const matchesDate =
      (!dateRange.from || date >= dateRange.from) &&
      (!dateRange.to || date <= new Date(dateRange.to.setHours(23, 59, 59, 999)));

    return matchesSearch && matchesDate;
  });

  const stats = {
    totalSpent: filteredTransactions
      .filter(tx => normalizeTransactionStatus(tx.status) === 'SUCCESS' && (tx.type === 'RECHARGE' || tx.type === 'BILL_PAYMENT'))
      .reduce((acc, tx) => acc + Number(tx.amount), 0),
    totalCashback: filteredTransactions
      .filter(tx => normalizeTransactionStatus(tx.status) === 'SUCCESS')
      .reduce((acc, tx) => acc + (Number(tx.commission) || 0), 0),
    successCount: filteredTransactions
      .filter(tx => normalizeTransactionStatus(tx.status) === 'SUCCESS').length,
    failedCount: filteredTransactions
      .filter(tx => normalizeTransactionStatus(tx.status) === 'FAILED').length
  };

  const handleExport = async (mode: 'download' | 'share') => {
    if (!user || filteredTransactions.length === 0) return;
    try {
      const doc = await generateHistoryPDF(filteredTransactions, {
        id: user.id,
        name: user.email?.split('@')[0],
        phone: user.phone
      }, "Transaction History Statement");
      
      if (mode === 'share') {
        await sharePDF(doc, `Prepe_History_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast({ title: "Shared successfully", description: "The statement has been sent." });
      } else {
        doc.save(`Prepe_History_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast({ title: "Downloaded", description: "PDF history statement successfully saved." });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({ variant: "destructive", title: "Export Failed", description: "Could not generate PDF file." });
    }
  };

  const tabs = ['Recharges', 'Deposits', 'Referrals', 'Cashbacks'];
  const presets = [
    { label: 'Recent', icon: <History className="h-3.5 w-3.5" /> },
    { label: 'Today', icon: <CalendarIcon className="h-3.5 w-3.5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Immersive Dashboard Stats Overhaul */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-between h-36">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[40px] -mr-8 -mb-8"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Transaction Volume</span>
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-white tracking-tighter">₹{stats.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Approved Recharges & Bills</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-950 to-emerald-900 p-6 rounded-[2rem] border border-emerald-500/10 shadow-2xl flex flex-col justify-between h-36">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -mr-8 -mb-8"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Total Cashback</span>
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Sparkles className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-black text-white tracking-tighter">₹{stats.totalCashback.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[9px] text-emerald-300/60 font-bold uppercase tracking-wider">Direct Earnings & Commissions</p>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] border border-white/5 shadow-2xl flex flex-col justify-between h-36">
          <div className="absolute right-0 bottom-0 w-32 h-32 bg-slate-500/10 rounded-full blur-[40px] -mr-8 -mb-8"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compliance Check</span>
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl">
              <Activity className="h-4 w-4 text-slate-400" />
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h3 className="text-3xl font-black text-white tracking-tighter">{stats.successCount + stats.failedCount}</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Total Evaluated Actions</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              {stats.successCount} OK
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filter Desk */}
      <div className="bg-white p-5 rounded-[2.2rem] border border-slate-100 shadow-xl shadow-slate-100/50 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by ID, recipient number, or operator..."
            className="pl-12 bg-slate-50/50 border-none shadow-inner rounded-2xl h-12 font-medium text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-100 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Action Controls & Date Picker Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
            {presets.map(p => (
              <Button
                key={p.label}
                variant={filterPreset === p.label ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterPreset(p.label)}
                className={cn(
                  "rounded-full gap-2 whitespace-nowrap h-9 px-4 font-black text-[10px] uppercase tracking-wider transition-all",
                  filterPreset === p.label 
                    ? "bg-slate-900 text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800" 
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                )}
              >
                {p.icon}
                {p.label}
              </Button>
            ))}
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full gap-2 whitespace-nowrap h-9 px-4 font-black text-[10px] uppercase tracking-wider bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  <CalendarIcon className="h-3.5 w-3.5" />
                  Pick Date
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border border-slate-100" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={1}
                  className="p-3"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2 h-9 px-4 font-black text-[10px] uppercase tracking-wider bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => handleExport('download')}
            >
              <Download className="h-3.5 w-3.5" />
              Statement
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-2 h-9 px-4 font-black text-[10px] uppercase tracking-wider bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              onClick={() => handleExport('share')}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>

        {/* Elegant Pill Switch Tabs */}
        <div className="bg-slate-100/60 p-1.5 rounded-[22px] flex items-center gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 px-5 py-2.5 rounded-[18px] font-black text-[10px] uppercase tracking-wider transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-white text-slate-900 shadow-md shadow-slate-200/50" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-white/40"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction Records Desk */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] animate-pulse">Syncing Transaction Desk...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 border border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50 space-y-4"
          >
            <div className="bg-white p-5 rounded-full w-fit mx-auto shadow-md">
              <History className="h-8 w-8 text-slate-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">No matching activities</h3>
              <p className="text-xs text-slate-400 font-medium">Verify your search query or reset date presets.</p>
            </div>
            <Button 
              variant="outline" 
              className="rounded-full font-black text-[10px] uppercase tracking-wider border-slate-200" 
              onClick={() => { setSearchQuery(''); setActiveTab('Recharges'); setFilterPreset('Recent'); setDateRange({ from: undefined, to: undefined }); }}
            >
              Reset Filters
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3.5">
            <AnimatePresence mode="popLayout">
              {filteredTransactions.map((tx, index) => {
                const status = normalizeTransactionStatus(tx.status);
                const isFav = !!favorites[tx.id];
                const isFavPending = !!favLoading[tx.id];

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-slate-900/10 hover:shadow-xl hover:shadow-slate-100/50 transition-all overflow-hidden flex flex-col cursor-pointer"
                    onClick={() => navigate(`/transaction/${tx.id}`, { state: { transaction: tx } })}
                  >
                    <div className="p-5 flex items-center justify-between gap-4">
                      {/* Left Badge branding & Info */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="shrink-0 transition-transform duration-300 group-hover:scale-105">
                          {getServiceIcon(tx)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-slate-900 tracking-tight leading-tight group-hover:text-blue-600 transition-colors">
                            {tx.operator_name || (tx.service_type === 'WALLET' ? 'Wallet Topup' : 'Recharge')}
                          </h4>
                          <p className="text-xs text-slate-500 font-bold tracking-tight mt-1 flex items-center gap-1.5">
                            {tx.mobile_number || tx.dth_id || 'Internal Record'}
                          </p>
                        </div>
                      </div>

                      {/* Right Amount details & primary states */}
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <p className="text-xl font-black text-slate-950 tracking-tighter">₹{Number(tx.amount).toFixed(2)}</p>
                          <div className="mt-1.5 flex justify-end">
                            {status === 'SUCCESS' && (
                              <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border-none">
                                Success
                              </Badge>
                            )}
                            {status === 'FAILED' && (
                              <Badge className="bg-rose-50 hover:bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border-none">
                                Failed
                              </Badge>
                            )}
                            {status === 'PENDING' && (
                              <Badge className="bg-amber-50 hover:bg-amber-50 text-amber-600 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border-none">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Favorite button control */}
                        <div className="flex flex-col items-center justify-center pl-2 border-l border-slate-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isFavPending}
                            onClick={(e) => handleToggleFavorite(e, tx)}
                            className={cn(
                              "h-10 w-10 rounded-full hover:bg-rose-50 transition-colors",
                              isFav ? "text-rose-500 hover:text-rose-600" : "text-slate-300 hover:text-rose-400"
                            )}
                          >
                            {isFavPending ? (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            ) : (
                              <Heart className={cn("h-4.5 w-4.5", isFav && "fill-current")} />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Meta strip metadata details */}
                    <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                      <div className="flex items-center gap-2">
                        <span>{format(new Date(tx.created_at), 'yyyy-MM-dd')}</span>
                        <span className="opacity-50">{format(new Date(tx.created_at), 'HH:mm:ss')}</span>
                      </div>
                      
                      <span className="truncate max-w-[140px] font-mono tracking-tight text-[9px] opacity-75">
                        REF: #{tx.reference_id || tx.id.substring(0, 12)}
                      </span>

                      {Number(tx.commission) > 0 && (
                        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                          <span className="text-[8px] font-bold">CASHBACK</span>
                          <span>+₹{Number(tx.commission).toFixed(2)}</span>
                        </div>
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
  );
}

