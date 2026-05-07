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
  Loader2,
  Contact,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronLeft,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from 'react-router-dom';

const IS_DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === 'true';

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

import type {
  Operator,
  Circle,
  RechargePlan,
} from '@/types/recharge.types';

export function MobileRechargeForm() {
  const { user } = useAuth();
  const { availableBalance, refetch } = useWallet();
  const { toast } = useToast();
  const { isApproved } = useKYC();
  const { limits, checkRechargeLimit } = usePlanLimits();
  const location = useLocation();

  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [showKYCNudge, setShowKYCNudge] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [selectedCircle, setSelectedCircle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [planCategory, setPlanCategory] = useState('all');
  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detecting, setDetecting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);

  /* ========================================
     Prefill mobile
  ======================================== */
  useEffect(() => {
    if (location.state?.mobileNumber) {
      setMobileNumber(location.state.mobileNumber);
    }
  }, [location.state]);

  /* ========================================
     Load Initial Data
  ======================================== */
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

        if (user) {
          const history = await getTransactionHistory(user.id, 5, 'MOBILE_PREPAID');
          setRecentTransactions(history.filter((t: any) => t.status === 'SUCCESS'));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  /* ========================================
     Auto Detect Operator
  ======================================== */
  useEffect(() => {
    const run = async () => {
      if (mobileNumber.length === 10) {
        setDetecting(true);
        try {
          const result = await detectOperator(mobileNumber);
          if (result.status === 'SUCCESS' && result.data) {
            setSelectedOperator(result.data.operator.id);
            setSelectedCircle(result.data.circle.id);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setDetecting(false);
        }
      } else {
        setSelectedOperator('');
        setSelectedCircle('');
        setPlans([]);
      }
    };
    run();
  }, [mobileNumber]);

  /* ========================================
     Load Plans
  ======================================== */
  useEffect(() => {
    const loadPlans = async () => {
      if (!selectedOperator || mobileNumber.length !== 10) return;
      setLoadingPlans(true);
      try {
        const result = await getPlans(selectedOperator, selectedCircle || '1', planCategory);
        if (result.status === 'SUCCESS' && Array.isArray(result.data)) {
          setPlans(result.data);
        } else {
          setPlans([]);
        }
      } catch (err) {
        setPlans([]);
      } finally {
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, [selectedOperator, selectedCircle, planCategory, mobileNumber]);

  const handlePlanSelect = (plan: RechargePlan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount.toString());
  };

  /* ========================================
     Recharge Handlers
  ======================================== */
  const handleProceedToConfirm = () => {
    if (!user) {
      toast({ title: 'Please login', variant: 'destructive' });
      return;
    }
    if (!isApproved) {
      setShowKYCNudge(true);
      return;
    }
    if (mobileNumber.length !== 10) {
      toast({ title: 'Invalid mobile number', variant: 'destructive' });
      return;
    }
    if (!selectedOperator || !amount) {
      toast({ title: 'Missing details', variant: 'destructive' });
      return;
    }

    const rechargeAmount = parseFloat(amount);
    if (rechargeAmount > availableBalance) {
      toast({ title: 'Insufficient Balance', variant: 'destructive' });
      return;
    }

    setStep('confirm');
  };

  const executeRecharge = async () => {
    if (!user) return;
    const rechargeAmount = parseFloat(amount);
    setProcessing(true);

    try {
      const result = await processRecharge(user.id, {
        mobile_number: mobileNumber,
        operator_id: selectedOperator,
        circle_id: selectedCircle,
        amount: rechargeAmount,
        plan_id: selectedPlan?.id,
      });

      if (result.status === 'SUCCESS' || result.status === 'PENDING') {
        toast({
          title: result.status === 'SUCCESS' ? 'Recharge Successful' : 'Recharge Processing',
          description: result.status === 'SUCCESS' ? `₹${rechargeAmount} recharge done` : 'Please wait while recharge completes',
        });
        refetch();
        setStep('form');
        setMobileNumber('');
        setAmount('');
        setSelectedPlan(null);
      } else {
        toast({
          title: 'Recharge Failed',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // ============================================================
  // CONFIRMATION VIEW (FULL PAGE)
  // ============================================================
  if (step === 'confirm') {
    return (
      <div className="space-y-6 animate-in slide-in-from-right duration-300">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setStep('form')} className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <h2 className="text-xl font-bold">Confirm Payment</h2>
        </div>

        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/50 rounded-3xl overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-blue-600 p-8 text-white text-center">
              <p className="text-blue-100 text-sm uppercase tracking-widest mb-1">Recharge Amount</p>
              <h1 className="text-5xl font-black italic tracking-tighter">₹{amount}</h1>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-inner">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Mobile Number</p>
                    <p className="text-lg font-black tracking-widest text-slate-800">{mobileNumber}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Operator & Circle</p>
                    <p className="text-lg font-bold text-slate-800">
                      {operators.find(o => o.id === selectedOperator)?.name} - {circles.find(c => c.id === selectedCircle)?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shadow-inner">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Wallet Balance</p>
                    <p className="text-lg font-bold text-slate-800">₹{availableBalance}</p>
                  </div>
                </div>
              </div>

              {selectedPlan && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-1">Plan Benefit</p>
                  <p className="text-sm font-medium text-slate-600 leading-relaxed">{selectedPlan.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Alert variant="destructive" className="bg-red-50 border-red-200 rounded-2xl p-4 border-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-sm text-red-900 leading-tight">
            <strong className="block mb-1 text-red-700 font-black">IMPORTANT DISCLAIMER:</strong> 
            Please verify the number carefully. We are not responsible for recharges sent to an incorrect number. Successful recharges are <strong>non-refundable</strong>.
          </AlertDescription>
        </Alert>

        <div className="pt-4">
          <Button 
            className="w-full h-16 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95"
            onClick={executeRecharge}
            disabled={processing}
          >
            {processing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "PAY SECURELY NOW"}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Secure Transaction by Pre-Pe
          </p>
        </div>
      </div>
    );
  }

  // ============================================================
  // FORM VIEW
  // ============================================================
  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {IS_DEMO_MODE && (
        <div className="rounded-xl border bg-yellow-50 p-3 text-sm">
          Demo Mode Enabled
        </div>
      )}

      {/* MOBILE INPUT SECTION */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-3xl border shadow-sm ring-1 ring-black/5">
        <Label className="text-sm font-bold mb-3 block text-slate-700 uppercase tracking-wider">
          Mobile Number
        </Label>

        <div className="relative">
          <Input
            className="text-2xl font-black tracking-[0.2em] h-16 rounded-2xl border-2 focus:border-blue-500 transition-all"
            placeholder="0000000000"
            maxLength={10}
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
          />
          <div className="absolute right-4 top-4">
            {detecting ? (
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                <Contact className="h-5 w-5 text-slate-500" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CONDITIONAL CONTENT: RECENT OR PLAN SELECTION */}
      {mobileNumber.length < 10 ? (
        <Card className="border-none bg-muted/20 rounded-3xl">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3 text-slate-500">
              <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center">
                <Info className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold">Enter 10 digits to see plans</h3>
            </div>

            {recentTransactions.length > 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Recharges</p>
                <div className="grid grid-cols-1 gap-3">
                  {recentTransactions.map((txn) => (
                    <div 
                      key={txn.id} 
                      className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm hover:border-blue-200 transition-all cursor-pointer group"
                      onClick={() => setMobileNumber(txn.mobile_number)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                          <Smartphone className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-black text-slate-700 tracking-wider">{txn.mobile_number}</p>
                          <p className="text-[10px] font-bold text-slate-400">SUCCESSFUL RECHARGE</p>
                        </div>
                      </div>
                      <span className="font-black text-blue-600">₹{txn.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Operator</Label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-bold text-slate-700">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 shadow-2xl">
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id} className="rounded-xl my-1 focus:bg-blue-50">{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Circle</Label>
              <Select value={selectedCircle} onValueChange={setSelectedCircle}>
                <SelectTrigger className="h-14 rounded-2xl border-2 font-bold text-slate-700">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-2 shadow-2xl">
                  {circles.map((circle) => (
                    <SelectItem key={circle.id} value={circle.id} className="rounded-xl my-1 focus:bg-blue-50">{circle.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-4 font-black text-slate-400 text-lg">₹</span>
              <Input
                className="pl-9 h-14 text-xl font-black rounded-2xl border-2 border-blue-100 bg-blue-50/20"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
            <Button
              className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black shadow-xl shadow-blue-100 transition-all active:scale-95"
              onClick={handleProceedToConfirm}
              disabled={processing || !amount || !selectedOperator}
            >
              CONTINUE
            </Button>
          </div>

          {selectedOperator && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <Label className="text-sm font-black text-slate-700 uppercase tracking-widest">Recommended Plans</Label>
              </div>
              
              <Tabs value={planCategory} onValueChange={setPlanCategory}>
                <TabsList className="w-full bg-slate-100 p-1.5 rounded-2xl h-14 shadow-inner">
                  <TabsTrigger value="all" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">All</TabsTrigger>
                  <TabsTrigger value="unlimited" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Unlimited</TabsTrigger>
                  <TabsTrigger value="data" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Data</TabsTrigger>
                  <TabsTrigger value="combo" className="flex-1 rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-md transition-all">Combo</TabsTrigger>
                </TabsList>
                <TabsContent value={planCategory} className="mt-6">
                  {loadingPlans ? (
                    <div className="py-16 flex flex-col items-center gap-4">
                      <div className="relative h-12 w-12">
                         <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
                         <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
                      </div>
                      <p className="text-xs font-black text-slate-400 tracking-widest uppercase animate-pulse">Fetching Plans</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar pb-10">
                      {plans.map((plan) => (
                        <Card
                          key={plan.id}
                          className={`cursor-pointer transition-all border-2 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 ${
                            selectedPlan?.id === plan.id ? 'border-blue-600 ring-4 ring-blue-50 bg-blue-50/30' : 'border-slate-100 bg-white'
                          }`}
                          onClick={() => handlePlanSelect(plan)}
                        >
                          <CardContent className="p-6">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-3xl font-black text-slate-800 tracking-tighter">₹{plan.amount}</span>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none px-4 py-1.5 rounded-full font-black text-[10px]">
                                {plan.validity}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed">{plan.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      )}

      <KYCNudgeDialog
        isOpen={showKYCNudge}
        onClose={() => setShowKYCNudge(false)}
        featureName="Recharge"
      />
    </div>
  );
}