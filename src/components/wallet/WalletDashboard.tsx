import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, Plus, History, ArrowUpRight, ArrowDownLeft, Lock, Zap, Loader2, CheckCircle, ArrowRightLeft, CreditCard } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useAuth } from '@/hooks/useAuth';
import { getWalletLedger } from '@/services/wallet.service';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { AdBanner } from './AdBanner';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

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
        return <ArrowDownLeft className="h-4 w-4 text-emerald-500" />;
      case 'DEBIT':
        return <ArrowUpRight className="h-4 w-4 text-rose-500" />;
      case 'LOCK':
        return <Lock className="h-4 w-4 text-slate-400" />;
      case 'UNLOCK':
      case 'REFUND':
        return <ArrowDownLeft className="h-4 w-4 text-blue-500" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getEntryColors = (type: string) => {
    switch (type) {
      case 'CREDIT':
        return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' };
      case 'DEBIT':
        return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' };
      case 'REFUND':
      case 'UNLOCK':
        return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100' };
      default:
        return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-100' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Ads for Basic Users */}
      {isFeatureEnabled('ads') && <AdBanner />}

      {/* Balance Cards - More Stratified Style */}
      <div className="grid grid-cols-1 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900 text-white border-none shadow-[0_30px_60px_-15px_rgba(15,23,42,0.3)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-125 transition-transform duration-700">
                <Wallet className="h-32 w-32 rotate-12" />
            </div>
            <CardContent className="p-8 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
                   <Wallet className="h-5 w-5 text-indigo-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200/60">Global Net Worth</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-black text-indigo-300">₹</span>
                <p className="text-5xl font-black tracking-tighter">
                  {loading ? '...' : balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm border border-slate-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Available</span>
                </div>
                <p className="text-xl font-black text-slate-900">
                  {loading ? '...' : `₹${availableBalance.toLocaleString()}`}
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm border border-slate-100">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-slate-300"></div>
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">In Reserve</span>
                </div>
                <p className="text-xl font-black text-slate-400">
                  {loading ? '...' : `₹${lockedBalance.toLocaleString()}`}
                </p>
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Action Hub */}
      <div className="grid grid-cols-1 gap-6">
        {/* Add Money - Redesigned as a High-Invitation CTA */}
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors group overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex justify-between items-center text-lg font-black tracking-tight">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-600" />
                Add Money to Wallet
              </div>
              <CreditCard className="h-4 w-4 text-slate-300" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => navigate('/fund-request', { state: { amount: amt } })}
                  className="py-3 px-2 rounded-2xl bg-white border border-slate-100 text-[10px] font-black text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <Button 
               className="w-full h-14 rounded-2xl bg-slate-950 text-white font-black hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-2 group-hover:-translate-y-1" 
               onClick={() => navigate('/fund-request')}
            >
              <Plus className="h-5 w-5" />
              Custom Amount
            </Button>
            
            <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <CheckCircle className="h-3 w-3 text-emerald-500" />
                Instant Wallet Credit via UPI
            </p>
          </CardContent>
        </Card>

        {/* BNPL Section - Simplified and Integrated */}
        <Card className="bg-indigo-600 text-white border-none shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                <Zap className="h-20 w-20 fill-current" />
            </div>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base font-black italic tracking-tight uppercase">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-300 fill-current" />
                        Quick BNPL
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                   <h3 className="text-lg font-black leading-tight">Pay Later Enabled</h3>
                   <p className="text-indigo-200 text-xs font-medium">Get up to ₹1,000 credit instantly.</p>
                </div>
                <Button 
                    variant="secondary" 
                    className="w-full h-10 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white text-indigo-600 hover:bg-indigo-50"
                    onClick={() => navigate(planId === 'BASIC' ? '/onboarding/plans' : '/dnpl')}
                >
                    {planId === 'BASIC' ? 'Upgrade to Activate' : 'Activate BNPL'}
                </Button>
            </CardContent>
        </Card>
      </div>

      {/* Wallet Ledger - Redesigned for Professionalism */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Wallet Activity</h3>
            </div>
            <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-indigo-600 tracking-widest hover:bg-indigo-50" onClick={() => navigate('/wallet/ledger')}>
                View Ledger
            </Button>
        </div>

        <Card className="border-none shadow-sm bg-white overflow-hidden rounded-[2rem]">
            <CardContent className="p-0">
              {loadingLedger ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
                </div>
              ) : ledger.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                    <div className="bg-slate-50 p-4 rounded-3xl mb-4">
                        <ArrowRightLeft className="h-8 w-8 text-slate-200" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No wallet activity recorded</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {ledger.map((entry) => {
                    const colors = getEntryColors(entry.type);
                    return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all cursor-default group"
                        >
                          <div className="flex items-center gap-5">
                            <div className={`h-12 w-12 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105`}>
                              {getTypeIcon(entry.type)}
                            </div>
                            <div className="flex flex-col text-left">
                              <p className="font-black text-slate-800 text-sm leading-none mb-1.5">{entry.description}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                {format(new Date(entry.created_at), 'dd MMM, HH:mm')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-4 py-1.5 rounded-xl ${colors.bg} ${colors.text} border ${colors.border} font-black text-sm tabular-nums mb-1`}>
                              {entry.type === 'CREDIT' || entry.type === 'REFUND' || entry.type === 'UNLOCK' ? '+' : '-'}
                              ₹{entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mr-1">
                              Bal: ₹{entry.balance_after.toLocaleString()}
                            </p>
                          </div>
                        </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
