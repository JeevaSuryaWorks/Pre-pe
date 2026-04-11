import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, History, ArrowUpRight, ArrowDownLeft, Lock, Zap, Loader2, Building, CheckCircle, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { getWalletLedger } from '@/services/wallet.service';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { PayoutForm } from './PayoutForm';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { AdBanner } from './AdBanner';
import { Badge } from '@/components/ui/badge';

interface LedgerEntry {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

export function WalletDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance, lockedBalance, availableBalance, loading, refetch } = useWallet();
  const { limits, isFeatureEnabled, planId, loading: planLoading } = usePlanLimits();
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    const loadLedger = async () => {
      if (user) {
        setLoadingLedger(true);
        const entries = await getWalletLedger(user.id, 20);
        setLedger(entries);
        setLoadingLedger(false);
      }
    };
    loadLedger();
  }, [user]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return <ArrowDownLeft className="h-4 w-4 text-chart-2" />;
      case 'DEBIT':
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case 'LOCK':
        return <Lock className="h-4 w-4 text-muted-foreground" />;
      case 'UNLOCK':
      case 'REFUND':
        return <ArrowDownLeft className="h-4 w-4 text-chart-3" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return 'text-chart-2';
      case 'DEBIT':
        return 'text-destructive';
      case 'REFUND':
      case 'UNLOCK':
        return 'text-chart-3';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Ads for Basic Users */}
      {isFeatureEnabled('ads') && <AdBanner />}

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-[#28A745] text-white border-none shadow-lg shadow-emerald-500/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <Wallet className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Total Balance</span>
            </div>
            <p className="text-3xl font-black">
              {loading ? '...' : `₹${balance.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-blue-50 rounded-lg">
                <ArrowUpRight className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Available</span>
            </div>
            <p className="text-3xl font-black text-slate-900">
              {loading ? '...' : `₹${availableBalance.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md bg-white sm:col-span-2 lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Locked Balance</span>
            </div>
            <p className="text-3xl font-black text-slate-400">
              {loading ? '...' : `₹${lockedBalance.toFixed(2)}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Sections - One by One */}
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Money to Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-accent/50 rounded-lg p-4 text-center space-y-3">
              <p className="text-muted-foreground">
                Add money securely via UPI
              </p>
              <Button className="w-full" onClick={() => navigate('/fund-request')}>
                Add Money
              </Button>
            </div>

            {/* Quick Add Amounts */}
            <div className="mt-4 flex flex-col gap-2">
              {[100, 200, 500, 1000].map((amt) => (
                <Button
                  key={amt}
                  variant="outline"
                  onClick={() => navigate('/fund-request', { state: { amount: amt } })}
                  className="w-full h-12 rounded-xl font-black border-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white transition-all"
                >
                  ₹{amt}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal/Payout Section */}
        <PayoutForm />

        {/* BNPL Section */}
        <Card className="bg-slate-900 text-white border-none shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Zap className="h-24 w-24 fill-current" />
            </div>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl font-black italic tracking-tight">
                    <div className="flex items-center gap-2">
                        <Zap className="h-6 w-6 text-amber-400 fill-current" />
                        BNPL
                    </div>
                    {planId !== 'BASIC' && (
                        <Badge variant="secondary" className="bg-amber-400 text-slate-900 font-black text-[10px]">
                            {planId} PLAN
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
                <div>
                   <h3 className="text-2xl font-black mb-1">Buy Now Pay Later</h3>
                   <p className="text-slate-400 text-sm font-medium">Instantly borrow up to ₹1,000 for your recharges.</p>
                </div>
                <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-400">
                    <CheckCircle className="h-3 w-3" /> Zero Interest for 15 Days
                </div>
                <Button 
                    variant="secondary" 
                    className={`w-full h-12 rounded-xl font-black transition-colors ${planId === 'BASIC' ? 'bg-slate-700 text-slate-400' : 'text-slate-900 hover:bg-amber-400'}`}
                    onClick={() => navigate(planId === 'BASIC' ? '/onboarding/plans' : '/dnpl')}
                >
                    {planId === 'BASIC' ? 'Upgrade to Activate' : 'Activate BNPL'}
                </Button>
            </CardContent>
        </Card>
      </div>

      {/* Wallet Ledger */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Wallet Activity
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/wallet/ledger')}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          {loadingLedger ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading...
            </div>
          ) : ledger.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No wallet activity yet
            </div>
          ) : (
            <div className="space-y-3">
              {ledger.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-card">
                      {getTypeIcon(entry.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{entry.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getTypeColor(entry.type)}`}>
                      {entry.type === 'CREDIT' || entry.type === 'REFUND' || entry.type === 'UNLOCK' ? '+' : '-'}
                      ₹{entry.amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bal: ₹{entry.balance_after.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
