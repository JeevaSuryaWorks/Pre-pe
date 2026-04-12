import { useEffect, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Search, Calendar as CalendarIcon, Loader2, History, Smartphone, Tv, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
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

  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const [favorites, setFavorites] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const loadTransactions = async () => {
      if (user) {
        setLoading(true);
        const txns = await getTransactionHistory(user.id, 50);
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
        // Remove
        const success = await removeSavedItem(favorites[tx.id]!);
        if (success) {
            setFavorites(prev => ({ ...prev, [tx.id]: null }));
            toast({ title: "Removed from Saved", description: "Transaction removed from your favorites." });
        }
    } else {
        // Add
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

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'MOBILE_PREPAID':
        return <Smartphone className="h-4 w-4" />;
      case 'DTH':
        return <Tv className="h-4 w-4" />;
      case 'MOBILE_POSTPAID':
        return <FileText className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge className="bg-chart-2/20 text-chart-2 hover:bg-chart-2/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'REFUNDED':
        return (
          <Badge className="bg-chart-3/20 text-chart-3 hover:bg-chart-3/30">
            Refunded
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getServiceLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'MOBILE_PREPAID':
        return 'Mobile Prepaid';
      case 'DTH':
        return 'DTH Recharge';
      case 'MOBILE_POSTPAID':
        return 'Postpaid Bill';
      default:
        return serviceType;
    }
  };

  // Filter Transactions
  const filteredTransactions = transactions.filter((tx) => {
    const query = searchQuery.toLowerCase();
    const date = new Date(tx.created_at);

    // Search Filter
    const matchesSearch =
      tx.id.toLowerCase().includes(query) ||
      (tx.mobile_number && tx.mobile_number.includes(query)) ||
      (tx.dth_id && tx.dth_id.includes(query)) ||
      (tx.reference_id && tx.reference_id.toLowerCase().includes(query));

    // Date Filter
    const matchesDate =
      (!dateRange.from || date >= dateRange.from) &&
      (!dateRange.to || date <= new Date(dateRange.to.setHours(23, 59, 59, 999)));

    return matchesSearch && matchesDate;
  });

  const handleExport = async (mode: 'download' | 'share') => {
    if (!user || filteredTransactions.length === 0) return;

    try {
        const doc = await generateHistoryPDF(filteredTransactions, {
            id: user.id,
            name: user.email?.split('@')[0],
            phone: user.phone
        }, "Transaction History Statement");

        if (mode === 'share') {
            const shared = await sharePDF(doc, `Prepe_History_${format(new Date(), 'yyyyMMdd')}.pdf`);
            if (shared) {
                toast({ title: "History Shared", description: "Your PDF statement has been shared successfully." });
            }
        } else {
            doc.save(`Prepe_History_${format(new Date(), 'yyyyMMdd')}.pdf`);
            toast({ title: "History Downloaded", description: "Your transaction records are ready." });
        }
    } catch (error) {
        console.error("Export error:", error);
        toast({ variant: "destructive", title: "Export Failed", description: "There was an error generating your PDF report." });
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, Mobile, or Reference..."
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] justify-start text-left font-normal bg-white",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="icon" 
                className="bg-white border-slate-200"
                onClick={() => handleExport('download')}
                title="Download History"
            >
                <Download className="h-4 w-4 text-slate-600" />
            </Button>
            <Button 
                variant="outline" 
                size="icon" 
                className="bg-white border-slate-200"
                onClick={() => handleExport('share')}
                title="Share History"
            >
                <Share2 className="h-4 w-4 text-slate-600" />
            </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-slate-50 border-dashed border-slate-200">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No transactions match your filters</p>
          <Button variant="link" onClick={() => { setSearchQuery(''); setDateRange({ from: undefined, to: undefined }); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-primary/30 hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
              onClick={() => navigate(`/transaction/${tx.id}`, { state: { transaction: tx } })}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-slate-50 text-slate-600">
                  {getServiceIcon(tx.service_type)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">
                    {tx.mobile_number || tx.dth_id || 'N/A'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">
                      {getServiceLabel(tx.service_type)}
                    </span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">
                      {format(new Date(tx.created_at), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex items-center gap-3">
                <div className="flex flex-col items-end">
                    <p className="font-bold text-lg text-slate-900">₹{Number(tx.amount).toFixed(2)}</p>
                    <div className="mt-1">{getStatusBadge(tx.status)}</div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-10 w-10 md:h-8 md:w-8 rounded-full transition-all duration-300",
                        favorites[tx.id] ? "text-rose-500 bg-rose-50" : "text-slate-300 hover:text-rose-400 hover:bg-slate-50"
                    )}
                    onClick={(e) => handleToggleFavorite(e, tx)}
                >
                    <Heart className={cn("h-5 w-5 md:h-4 md:w-4", favorites[tx.id] && "fill-current")} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
