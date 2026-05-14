import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Contact,
  FlaskConical,
  ArrowLeft,
  CheckCircle2,
  Zap,
  Info,
  ChevronLeft,
  ChevronRight,
  Search,
  XCircle,
  Clock,
  Phone,
  Smartphone,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getOperators,
  getCircles,
  detectOperator,
} from '@/services/operator.service';
import { getPlans } from '@/services/plans.service';
import {
  processRecharge,
  getTransactionHistory,
} from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { useKYC } from '@/hooks/useKYC';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { KYCNudgeDialog } from '@/components/kyc/KYCNudgeDialog';
import { paymentService } from '@/services/payment.service';
import { useProfile } from '@/hooks/useProfile';

import type {
  Operator,
  Circle,
  RechargePlan,
} from '@/types/recharge.types';

const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

const OPERATOR_LOGOS: Record<string, string> = {
  '1': '/logos/airtel_new.svg',
  '2': '/logos/bsnl_new.png',
  '3': '/logos/jio_new.svg',
  '4': '/logos/vi_new.svg',
};

type FlowStep = 'number' | 'details' | 'confirm' | 'result';

export function MobileRechargeForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { availableBalance, refetch } = useWallet();
  const { profile } = useProfile();
  const { toast } = useToast();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const { isApproved } = useKYC();
  const { limits, checkRechargeLimit } = usePlanLimits();
  const location = useLocation();

  const [step, setStep] = useState<FlowStep>('number');
  const [showKYCNudge, setShowKYCNudge] = useState(false);
  const [mobileNumber, setMobileNumber] = useState(''); // Formatted with space
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [planCategory, setPlanCategory] = useState('all');
  const [planSearchQuery, setPlanSearchQuery] = useState("");
  
  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [resultStatus, setResultStatus] = useState<'SUCCESS' | 'PENDING' | 'FAILED' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTopupFlow, setIsTopupFlow] = useState(false);
  const [topupRefId, setTopupRefId] = useState<string | null>(null);
  const [shortfall, setShortfall] = useState(0);
  const [showTopupQr, setShowTopupQr] = useState(false);
  const [intentUrl, setIntentUrl] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ops, circs] = await Promise.all([
          getOperators('prepaid'),
          getCircles(),
        ]);
        setOperators(ops);
        setCircles(circs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      if (!user) return;
      const history = await getTransactionHistory(user.id, 5, 'MOBILE_PREPAID');
      setRecentTransactions(history.filter((t: any) => t.status === 'SUCCESS'));
    };
    loadHistory();
  }, [user?.id]);

  const handleMobileChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    // Format: 00000 00000
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = cleaned.slice(0, 5) + ' ' + cleaned.slice(5);
    }
    setMobileNumber(formatted);
  };

  useEffect(() => {
    const rawNumber = mobileNumber.replace(/\s/g, '');
    if (rawNumber.length === 10) {
      const run = async () => {
        setDetecting(true);
        try {
          const result = await detectOperator(rawNumber);
          if (result.status === 'SUCCESS' && result.data) {
            setSelectedOperator(result.data.operator.id);
            setSelectedCircle(result.data.circle.id);
            setTimeout(() => setStep('details'), 500);
          }
        } finally {
          setDetecting(false);
        }
      };
      run();
    }
  }, [mobileNumber]);

  useEffect(() => {
    if (!selectedOperator || step !== 'details') return;
    const load = async () => {
      setLoadingPlans(true);
      const result = await getPlans(selectedOperator, selectedCircle || '1', planCategory);
      setPlans(result.status === 'SUCCESS' ? result.data : []);
      setLoadingPlans(false);
    };
    load();
  }, [selectedOperator, selectedCircle, planCategory, step]);

  const handlePlanSelect = (plan: RechargePlan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount.toString());
    setStep('confirm');
  };

  const handleAutoTopup = async (neededAmount: number) => {
    setIsTopupFlow(true);
    setShortfall(neededAmount);
    setProcessing(true);
    
    try {
      const result = await paymentService.createUpiIntent(neededAmount);
      if (result.intent_url) {
        setTopupRefId(result.reference_id);
        setIntentUrl(result.intent_url);
        
        // Open UPI Intent on mobile, or show QR on desktop
        if (isMobile) {
          window.location.href = result.intent_url;
        } else {
          setShowTopupQr(true);
        }
        
        // Start polling for payment
        const poll = setInterval(async () => {
          try {
            const status = await paymentService.getPaymentStatus(result.reference_id);
            if (status.status === 'SUCCESS') {
              clearInterval(poll);
              await refetch(); // Sync wallet
              setIsTopupFlow(false);
              setTopupRefId(null);
              setShowTopupQr(false);
              // Small delay to ensure DB sync before retrying recharge
              setTimeout(() => handleExecuteRecharge(true), 1000);
            } else if (status.status === 'FAILED') {
              clearInterval(poll);
              setIsTopupFlow(false);
              setProcessing(false);
              toast({ title: 'Top-up Failed', variant: 'destructive' });
            }
          } catch (e) {
            console.warn('Polling top-up error:', e);
          }
        }, 3000);

        // Safety timeout for polling
        setTimeout(() => clearInterval(poll), 120000);
      }
    } catch (error: any) {
      setIsTopupFlow(false);
      setProcessing(false);
      toast({ title: 'Top-up Initiation Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleExecuteRecharge = async (force: boolean = false) => {
    const numAmount = parseFloat(amount);
    
    // Check balance before processing
    if (!force && availableBalance < numAmount) {
      handleAutoTopup(numAmount - availableBalance);
      return;
    }

    setProcessing(true);
    const rawNumber = mobileNumber.replace(/\s/g, '');
    try {
      const result = await processRecharge(user!.id, {
        mobile_number: rawNumber,
        operator_id: selectedOperator,
        circle_id: selectedCircle,
        amount: parseFloat(amount),
        plan_id: selectedPlan?.id,
      });

      if (result.status === 'SUCCESS' || result.status === 'PENDING') {
        const operatorObj = operators.find(o => o.id === selectedOperator);
        navigate('/recharge/receipt', {
          state: {
            amount,
            operator: operatorObj?.name || selectedOperator,
            number: rawNumber,
            refId: (result as any).referenceId || 'N/A',
            type: 'Mobile Recharge'
          }
        });
      } else {
        setResultStatus('FAILED');
        setErrorMessage(result.message);
        setStep('result');
      }
    } catch (error: any) {
      setResultStatus('FAILED');
      setErrorMessage(error.message);
      setStep('result');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isTopupFlow && processing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
        <div className="relative h-20 w-20 mx-auto">
          <Loader2 className="h-20 w-20 text-blue-600 animate-spin absolute inset-0" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="h-8 w-8 text-blue-400 fill-current" />
          </div>
        </div>
        <div className="space-y-2 text-center">
          <p className="font-black text-2xl text-slate-800 tracking-tighter">Verifying Top-up...</p>
          <p className="text-sm font-medium text-slate-400 max-w-[240px] mx-auto leading-relaxed">
            We are waiting for your ₹{shortfall.toFixed(2)} payment. Your recharge will proceed automatically once confirmed.
          </p>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 p-6">
        <div className="w-full max-w-sm text-center space-y-6">
          {resultStatus === 'SUCCESS' ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-100">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-slate-900">Success!</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight px-4">₹{amount} processed successfully for {mobileNumber}.</p>
            </div>
          ) : resultStatus === 'PENDING' ? (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-100">
                <Clock className="w-10 h-10 text-amber-600 animate-pulse" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-amber-900">Pending</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight px-4">Verifying your transaction...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-100">
                <XCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter text-rose-900">Failed</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight px-4">{errorMessage}</p>
            </div>
          )}

          <div className="pt-6">
            <Button 
              className="w-full h-14 rounded-2xl text-lg font-black bg-slate-900 text-white shadow-xl active:scale-95 transition-all"
              onClick={() => {
                setStep('number');
                setMobileNumber('');
                setAmount('');
                setSelectedPlan(null);
                setResultStatus(null);
              }}
            >
              DONE
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    const operatorObj = operators.find(o => o.id === selectedOperator);
    const circleObj = circles.find(c => c.id === selectedCircle);

    return (
      <div className="flex-1 flex flex-col pt-0 animate-in fade-in slide-in-from-right-8 duration-500 relative h-full overflow-hidden w-full">
        <div className="absolute top-3 left-3 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setStep('details')} 
            className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/30 shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>

        <Card className="border-none shadow-[0_20px_40px_rgba(0,0,0,0.05)] rounded-[35px] overflow-hidden flex flex-col flex-1 mb-4 w-full">
          <div className="bg-slate-900 p-8 text-white flex flex-col items-center text-center relative overflow-hidden shrink-0 pt-12">
             <div className="absolute top-0 right-0 p-4 opacity-5">
              <Zap size={140} />
            </div>
            <div className="w-16 h-16 bg-white rounded-2xl p-4 mb-4 shadow-2xl relative z-10 flex items-center justify-center">
              {OPERATOR_LOGOS[selectedOperator] ? (
                 <img 
                    src={OPERATOR_LOGOS[selectedOperator]} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    onError={(e) => { (e.target as any).style.display = 'none'; (e.target as any).nextSibling.style.display = 'block'; }} 
                  />
              ) : null}
              <Smartphone className={`w-8 h-8 text-slate-200 ${OPERATOR_LOGOS[selectedOperator] ? 'hidden' : 'block'}`} />
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-400 mb-1 relative z-10">{operatorObj?.name} • {circleObj?.name}</p>
            <h1 className="text-3xl font-black tracking-tighter relative z-10">{mobileNumber}</h1>
          </div>
          
          <CardContent className="p-8 space-y-6 bg-white flex-1 overflow-y-auto custom-scrollbar w-full">
            <div className="flex justify-between items-center pb-6 border-b border-slate-50">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</span>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900 leading-none">₹{amount}</h1>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase tracking-widest text-[9px]">Plan Benefits</span>
                <span className="text-blue-600">{selectedPlan?.validity}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 p-5 rounded-[24px] border border-slate-100/30">{selectedPlan?.description}</p>
            </div>

            <div className="flex items-center gap-3 p-5 bg-blue-50/40 rounded-[28px] border border-blue-100/20 shrink-0">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <FlaskConical className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[8px] font-black text-blue-800/60 uppercase tracking-widest leading-none mb-1">PrePe Wallet</p>
                <p className="text-lg font-black text-slate-800 leading-none">₹{availableBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="shrink-0 px-2 pb-2 w-full">
          <Button
            className="w-full h-16 rounded-[28px] text-lg font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
            onClick={() => handleExecuteRecharge()}
            disabled={processing}
          >
            {processing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "SECURE PAYMENT"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="flex-1 flex flex-col space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 overflow-hidden h-full w-full">
        <div className="flex items-center justify-between bg-slate-50/80 p-3 rounded-[24px] border border-slate-100 shrink-0 w-full">
          <div className="flex items-center gap-3 px-1">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">{mobileNumber}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select a Plan</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setStep('number')} className="h-8 rounded-lg text-blue-600 text-xs font-bold hover:bg-blue-50 px-3">Change</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 shrink-0 w-full px-1">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Operator</Label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-white font-bold shadow-sm">
                <SelectValue placeholder="Operator" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id} className="font-bold py-2 text-sm">{op.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Circle</Label>
            <Select value={selectedCircle} onValueChange={setSelectedCircle}>
              <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-white font-bold shadow-sm">
                <SelectValue placeholder="Circle" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {circles.map((circle) => (
                  <SelectItem key={circle.id} value={circle.id} className="font-bold py-2 text-sm">{circle.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden w-full">
          <div className="relative mb-3 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search plans (e.g. 1.5GB, Unlimited...)"
              className="pl-10 h-11 bg-slate-50/50 border-slate-100 rounded-xl font-bold placeholder:text-slate-300"
              value={planSearchQuery}
              onChange={(e) => setPlanSearchQuery(e.target.value)}
            />
          </div>

          {/* Quick Filter Chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 shrink-0">
             {['1.5GB', '2GB', '28 Days', '84 Days', 'Unlimited'].map(chip => (
               <button 
                 key={chip}
                 onClick={() => setPlanSearchQuery(prev => prev === chip ? "" : chip)}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 ${
                   planSearchQuery === chip 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                    : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                 }`}
               >
                 {chip}
               </button>
             ))}
          </div>

          <Tabs value={planCategory} onValueChange={setPlanCategory} className="flex-1 flex flex-col">
            <TabsList className="flex bg-slate-100/50 p-1 rounded-[18px] gap-1 mb-4 h-11 shrink-0 w-full">
              {[
                { id: 'all', label: 'All' },
                { id: 'unlimited', label: 'Unlimited' },
                { id: 'data', label: 'Data (GB)' },
                { id: 'combo', label: 'Validity' },
                { id: 'topup', label: 'Talktime' }
              ].map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex-1 rounded-[14px] text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-md transition-all h-full px-0"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={planCategory} className="flex-1 overflow-hidden mt-0 w-full">
              <div className="grid gap-3 h-full overflow-y-auto pr-1 custom-scrollbar pb-2 w-full">
                {plans.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 w-full">
                      <Search className="w-8 h-8 mb-2" />
                      <p className="text-[9px] font-black uppercase tracking-widest">No Plans Available</p>
                   </div>
                ) : plans
                    .filter(plan => planCategory === 'all' || plan.category === planCategory)
                    .filter(plan => 
                      plan.amount.toString().includes(planSearchQuery) || 
                      plan.description.toLowerCase().includes(planSearchQuery.toLowerCase()) ||
                      plan.validity.toLowerCase().includes(planSearchQuery.toLowerCase())
                    )
                    .map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => handlePlanSelect(plan)}
                    className="p-5 rounded-[28px] border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98] w-full"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">₹{plan.amount}</span>
                        <span className="text-[9px] font-black text-blue-600 mt-1 uppercase tracking-widest">{plan.validity}</span>
                      </div>
                      <div className="w-7 h-7 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal line-clamp-2">{plan.description}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 animate-in fade-in duration-700 pt-6 overflow-hidden h-full w-full">
      <div className="relative group shrink-0 w-full">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[40px] blur-2xl opacity-5 group-focus-within:opacity-10 transition duration-1000"></div>
        <div className="relative bg-white border-2 border-slate-100 rounded-[30px] p-5 focus-within:border-blue-500 transition-all shadow-xl shadow-slate-100/20 w-full">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-1">Mobile Number</Label>
          <div className="flex items-center gap-4 h-12 w-full">
            <span className="text-2xl font-bold text-slate-400 select-none shrink-0">+91</span>
            <div className="w-px h-6 bg-slate-100 shrink-0" />
            <input
              type="tel"
              maxLength={11} // Accounting for space
              autoFocus
              className="border-none p-0 h-full text-2xl font-bold tracking-tight focus:outline-none placeholder:text-slate-100 bg-transparent flex-1 min-w-0"
              placeholder="00000 00000"
              value={mobileNumber}
              onChange={(e) => handleMobileChange(e.target.value)}
            />
            <div className="flex-shrink-0">
              {detecting ? (
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                  <Phone className="h-5 w-5 text-slate-300" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-4 overflow-hidden w-full">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 shrink-0">Recent Transactions</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar pb-6 w-full">
          {recentTransactions.map((txn) => (
            <div
              key={txn.id}
              onClick={() => handleMobileChange(txn.mobile_number)}
              className="group flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-[28px] hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer w-full"
            >
              <div className="w-12 h-12 bg-slate-50 rounded-[18px] flex items-center justify-center text-xl font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                {txn.mobile_number.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-slate-800 tracking-tight leading-none truncate">{txn.mobile_number}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">₹{txn.amount}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-200 group-hover:text-blue-600 transition-all shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <KYCNudgeDialog isOpen={showKYCNudge} onClose={() => setShowKYCNudge(false)} featureName="Recharge" />

      {/* Auto-Topup QR Dialog for Desktop */}
      <Dialog open={showTopupQr} onOpenChange={(open) => {
        if (!open) {
          setShowTopupQr(false);
          setIsTopupFlow(false);
          setProcessing(false);
        }
      }}>
        <DialogContent className="max-w-xs rounded-[32px] p-8">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black">Scan to Pay</DialogTitle>
            <DialogDescription className="font-bold text-slate-400">
              ₹{shortfall.toFixed(2)} shortfall for recharge
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center space-y-6 py-4">
            <div className="bg-slate-50 p-4 rounded-[28px] border-2 border-dashed border-slate-200">
              <div className="bg-white p-3 rounded-2xl shadow-sm">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(intentUrl)}`}
                  alt="UPI QR Code"
                  className="w-40 h-40"
                />
              </div>
            </div>
            
            <div className="space-y-1 text-center">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">VPA ID</p>
              <p className="text-sm font-black text-emerald-600">bmsmobiles@barodampay</p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-tight">Waiting for payment...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}