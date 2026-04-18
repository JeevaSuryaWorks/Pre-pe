import { useEffect, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Calendar as CalendarIcon, Loader2, History, Smartphone, Tv, FileText, CheckCircle2, XCircle, Clock, TrendingUp, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getTransactionHistory } from '@/services/recharge.service';
import { format } from 'date-fns';
import type { Transaction } from '@/types/recharge.types';
import { addSavedItem, removeSavedItem, checkIsFavorite } from '@/services/saved.service';
import { toast } from '@/hooks/use-toast';
import { Heart, Download, Share2 } from 'lucide-react';
import { generateHistoryPDF, sharePDF } from '@/utils/pdfExport';

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

  useEffect(() => {
    const loadTransactions = async () => {
      if (user) {
        setLoading(true);
        const txns = await getTransactionHistory(user.id, 100);
        setTransactions(txns);
        
        // Load favorites status
        const favStatus: Record<string, string | null> = {};
        for (const tx of txns) {
            const favId = await checkIsFavorite(user.id, tx.id);
            favStatus[tx.id] = favId;
        }
        setFavorites(favStatus);
        
        setLoading(false);
      }
    };
    loadTransactions();
  }, [user]);

  const handleToggleFavorite = async (e: React.MouseEvent, tx: Transaction) => {
    e.stopPropagation();
    if (!user) return;

    if (favorites[tx.id]) {
        const success = await removeSavedItem(favorites[tx.id]!);
        if (success) {
            setFavorites(prev => ({ ...prev, [tx.id]: null }));
            toast({ title: "Removed from Saved", description: "Transaction removed from your favorites." });
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
            toast({ title: "Saved to Favorites", description: "You can find this in your Saved page." });
        }
    }
  };

  const getServiceIcon = (tx: Transaction) => {
    const operator = tx.operator_name?.toLowerCase() || '';
    if (operator.includes('jio')) return <div className="w-10 h-10 rounded-full bg-[#00529b] flex items-center justify-center text-white font-bold text-xs">Jio</div>;
    if (operator.includes('airtel')) return <div className="w-10 h-10 rounded-full bg-[#e11d2b] flex items-center justify-center text-white font-bold text-[10px]">Airtel</div>;
    if (operator.includes('vi')) return <div className="w-10 h-10 rounded-full bg-[#ff0000] flex items-center justify-center text-white font-bold text-xs">Vi</div>;
    if (operator.includes('bsnl')) return <div className="w-10 h-10 rounded-full bg-[#004a95] flex items-center justify-center text-white font-bold text-[10px]">BSNL</div>;
    
    switch (tx.service_type) {
      case 'MOBILE_PREPAID': return <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Smartphone className="h-5 w-5" /></div>;
      case 'DTH': return <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><Tv className="h-5 w-5" /></div>;
      case 'MOBILE_POSTPAID': return <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center"><FileText className="h-5 w-5" /></div>;
      default: return <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><History className="h-5 w-5" /></div>;
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
      .filter(tx => tx.status === 'SUCCESS' && (tx.type === 'RECHARGE' || tx.type === 'BILL_PAYMENT'))
      .reduce((acc, tx) => acc + Number(tx.amount), 0),
    totalCashback: filteredTransactions
      .filter(tx => tx.status === 'SUCCESS')
      .reduce((acc, tx) => acc + (Number(tx.commission) || 0), 0)
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
        } else {
            doc.save(`Prepe_History_${format(new Date(), 'yyyyMMdd')}.pdf`);
        }
    } catch (error) {
        console.error("Export error:", error);
    }
  };

  const tabs = ['Recharges', 'Deposits', 'Referrals', 'Cashbacks'];
  const presets = [
    { label: 'Recent', icon: <History className="h-3 w-3" /> },
    { label: 'Today', icon: <CalendarIcon className="h-3 w-3" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Search & Main Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, Mobile, or Operator..."
            className="pl-10 bg-white border-slate-200 rounded-full h-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Quick Presets Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {presets.map(p => (
            <Button
              key={p.label}
              variant={filterPreset === p.label ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPreset(p.label)}
              className={cn(
                "rounded-full gap-2 whitespace-nowrap h-9 px-4 font-bold text-xs",
                filterPreset === p.label ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white border-slate-200 text-slate-600"
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
                className="rounded-full gap-2 whitespace-nowrap h-9 px-4 font-bold text-xs bg-white border-slate-200 text-slate-600"
              >
                <CalendarIcon className="h-3 w-3" />
                Pick Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={dateRange}
                onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            className="rounded-full gap-2 whitespace-nowrap h-9 px-4 font-bold text-xs bg-white border-slate-200 text-slate-600"
            onClick={() => handleExport('download')}
          >
            <SlidersHorizontal className="h-3 w-3" />
            Filter
          </Button>
        </div>

        {/* Categories Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 pb-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap",
                activeTab === tab 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" 
                  : "bg-white text-slate-500 border border-slate-100 hover:bg-slate-50"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-3xl border border-emerald-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white rounded-2xl shadow-sm">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Spent</p>
            <p className="text-lg font-black text-slate-900 leading-tight">₹{stats.totalSpent.toFixed(0)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 border-l border-emerald-100 pl-4">
          <div className="p-2.5 bg-white rounded-2xl shadow-sm">
             <div className="h-5 w-5 bg-emerald-600 rounded-full flex items-center justify-center">
                <ArrowUpRight className="h-3 w-3 text-white rotate-180" />
             </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Cashback</p>
            <p className="text-lg font-black text-emerald-600 leading-tight">₹{stats.totalCashback.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
          <div className="bg-white p-4 rounded-full w-fit mx-auto shadow-sm mb-4">
            <History className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-bold">No transactions found</p>
          <Button variant="link" className="text-emerald-600 text-xs font-bold" onClick={() => { setSearchQuery(''); setActiveTab('Recharges'); setFilterPreset('Recent'); }}>
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all overflow-hidden cursor-pointer active:scale-[0.98]"
              onClick={() => navigate(`/transaction/${tx.id}`, { state: { transaction: tx } })}
            >
              {/* Top Card Section */}
              <div className="p-5 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="transition-transform group-hover:scale-110">
                      {getServiceIcon(tx)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">
                        {tx.operator_name || (tx.service_type === 'WALLET' ? 'Wallet Topup' : 'Recharge')}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {tx.mobile_number || tx.dth_id || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900">₹{Number(tx.amount).toFixed(2)}</p>
                    <div className="mt-1 flex justify-end">
                      {tx.status === 'SUCCESS' && (
                        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3" />
                          Success
                        </div>
                      )}
                      {tx.status === 'FAILED' && (
                        <div className="flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-bold">
                          <XCircle className="h-3 w-3" />
                          Failed
                        </div>
                      )}
                      {tx.status === 'PENDING' && (
                        <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold">
                          <Clock className="h-3 w-3" />
                          Pending
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Card Strip */}
              <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                <div className="flex items-center gap-2">
                  <span>{format(new Date(tx.created_at), 'yyyy-MM-dd')}</span>
                  <span className="opacity-50">{format(new Date(tx.created_at), 'HH:mm:ss')}</span>
                </div>
                <div className="flex items-center gap-1 max-w-[120px] truncate opacity-80">
                  #{tx.reference_id || tx.id.substring(0, 12)}
                </div>
                {(Number(tx.commission) > 0) && (
                   <div className="flex items-center gap-1.5 text-emerald-600 bg-white px-2 py-0.5 rounded-md border border-emerald-50">
                      <span className="text-[8px] opacity-70">₹</span>
                      <span>{(Number(tx.commission)).toFixed(2)}</span>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
