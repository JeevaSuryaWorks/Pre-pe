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
  FlaskConical,
} from 'lucide-react';
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
  const { availableBalance, refetch } =
    useWallet();

  const { toast } = useToast();
  const { isApproved } = useKYC();
  const { limits, checkRechargeLimit } =
    usePlanLimits();

  const location = useLocation();

  const [showKYCNudge, setShowKYCNudge] =
    useState(false);

  const [mobileNumber, setMobileNumber] =
    useState('');

  const [selectedOperator, setSelectedOperator] =
    useState('');

  const [selectedCircle, setSelectedCircle] =
    useState('');

  const [amount, setAmount] = useState('');

  const [selectedPlan, setSelectedPlan] =
    useState<RechargePlan | null>(null);

  const [planCategory, setPlanCategory] =
    useState('all');

  const [operators, setOperators] = useState<
    Operator[]
  >([]);

  const [circles, setCircles] = useState<
    Circle[]
  >([]);

  const [plans, setPlans] = useState<
    RechargePlan[]
  >([]);

  const [recentTransactions, setRecentTransactions] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [detecting, setDetecting] =
    useState(false);

  const [loadingPlans, setLoadingPlans] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [step, setStep] = useState<'form' | 'confirm'>('form');

  /* ========================================
     Prefill mobile
  ======================================== */
  useEffect(() => {
    if (location.state?.mobileNumber) {
      setMobileNumber(
        location.state.mobileNumber
      );
    }
  }, [location.state]);

  /* ========================================
     Load Initial Data
  ======================================== */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const [ops, circs] =
          await Promise.all([
            getOperators('prepaid'),
            getCircles(),
          ]);

        if (cancelled) return;

        setOperators(ops);
        setCircles(circs);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadHistory = async () => {
      if (!user) {
        setRecentTransactions([]);
        return;
      }

      const history =
        await getTransactionHistory(
          user.id,
          5,
          'MOBILE_PREPAID'
        );

      if (cancelled) return;

      setRecentTransactions(
        history.filter(
          (t: any) =>
            t.status === 'SUCCESS'
        )
      );
    };

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  /* ========================================
     Auto Detect Operator
  ======================================== */
  useEffect(() => {
    const run = async () => {
      if (mobileNumber.length === 10) {
        setDetecting(true);

        const result =
          await detectOperator(
            mobileNumber
          );

        if (
          result.status ===
          'SUCCESS' &&
          result.data
        ) {
          setSelectedOperator(
            result.data.operator.id
          );

          setSelectedCircle(
            result.data.circle.id
          );

          toast({
            title:
              'Operator Detected',
            description: `${result.data.operator.name} - ${result.data.circle.name}`,
          });
        }

        setDetecting(false);
      }
    };

    run();
  }, [mobileNumber]);

  /* ========================================
     Load Plans
  ======================================== */
  useEffect(() => {
    const loadPlans = async () => {
      if (!selectedOperator) return;

      setLoadingPlans(true);

      const result =
        await getPlans(
          selectedOperator,
          selectedCircle || '1',
          planCategory
        );

      if (
        result.status ===
        'SUCCESS' &&
        Array.isArray(result.data)
      ) {
        setPlans(result.data);
      } else {
        setPlans([]);
      }

      setLoadingPlans(false);
    };

    loadPlans();
  }, [
    selectedOperator,
    selectedCircle,
    planCategory,
  ]);

  const handlePlanSelect = (
    plan: RechargePlan
  ) => {
    setSelectedPlan(plan);
    setAmount(
      plan.amount.toString()
    );
  };

  /* ========================================
     Recharge
  ======================================== */
  const handleRecharge =
    async () => {
      if (!user) {
        toast({
          title:
            'Please login',
          variant:
            'destructive',
        });
        return;
      }

      if (!isApproved) {
        setShowKYCNudge(true);
        return;
      }

      if (
        mobileNumber.length !==
        10
      ) {
        toast({
          title:
            'Invalid mobile number',
          variant:
            'destructive',
        });
        return;
      }

      if (
        !selectedOperator ||
        !amount
      ) {
        toast({
          title:
            'Missing details',
          variant:
            'destructive',
        });
        return;
      }

      const rechargeAmount =
        parseFloat(amount);

      const limitCheck =
        await checkRechargeLimit();

      if (!limitCheck.allowed) {
        toast({
          title:
            'Limit Reached',
          description: `${limits.name} allows ${limits.dailyRechargeLimit} recharges/day`,
          variant:
            'destructive',
        });
        return;
      }

      if (
        rechargeAmount >
        availableBalance
      ) {
        toast({
          title:
            'Insufficient Balance',
          variant:
            'destructive',
        });
        return;
      }

      }
    };

  /* ========================================
     PROCEED TO CONFIRM
  ======================================== */
  const handleProceedToConfirm = async () => {
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

    // Pass limit check
    const limitCheck = await checkRechargeLimit();
    if (!limitCheck.allowed) {
      toast({
        title: 'Limit Reached',
        description: `${limits.name} allows ${limits.dailyRechargeLimit} recharges/day`,
        variant: 'destructive',
      });
      return;
    }

    setStep('confirm');
  };

  const executeRecharge = async () => {
    setProcessing(true);
    const rechargeAmount = parseFloat(amount);

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
          title: result.status === 'SUCCESS' ? 'Recharge Successful' : 'Recharge Pending',
          description: `₹${rechargeAmount} processed for ${mobileNumber}`,
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
        title: 'System Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
      </div>
    );
  }

  // ============================================================
  // CONFIRMATION VIEW (FULL PAGE)
  // ============================================================
  if (step === 'confirm') {
    const operatorObj = operators.find(o => o.id === selectedOperator);
    const circleObj = circles.find(c => c.id === selectedCircle);

    return (
      <div className="min-h-[80vh] flex flex-col pt-4 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => setStep('form')} className="rounded-full">
            <Loader2 className="w-6 h-6 rotate-180" /> {/* Back arrow placeholder or use Lucide ArrowLeft */}
          </Button>
          <h2 className="text-xl font-bold">Confirm Payment</h2>
        </div>

        <Card className="border-none shadow-2xl shadow-slate-100 rounded-[35px] overflow-hidden mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70 mb-2">Recharging for</p>
            <h1 className="text-3xl font-black mb-1">{mobileNumber}</h1>
            <p className="text-sm font-medium opacity-80">{operatorObj?.name} • {circleObj?.name}</p>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="flex justify-between items-center py-4 border-b border-slate-50">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Amount</span>
              <h1 className="text-5xl font-black italic tracking-tighter text-slate-900">₹{amount}</h1>
            </div>

            {selectedPlan && (
              <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Validity</span>
                  <span className="text-sm font-black text-slate-700">{selectedPlan.validity}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{selectedPlan.description}</p>
              </div>
            )}

            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <FlaskConical className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Wallet Balance</p>
                <p className="text-sm font-bold text-slate-700">₹{availableBalance.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-auto space-y-4">
          <Button
            className="w-full h-16 rounded-2xl text-lg font-bold bg-blue-600 hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-95"
            onClick={executeRecharge}
            disabled={processing}
          >
            {processing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "PAY SECURELY NOW"}
          </Button>
          <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Encrypted & Secure Transaction
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {IS_DEMO_MODE && (
        <div className="rounded-xl border bg-yellow-50 p-3 text-sm">
          Demo Mode Enabled
        </div>
      )}

      {/* MOBILE */}
      <div>
        <Label>
          Mobile Number
        </Label>

        <div className="relative">
          <Input
            maxLength={10}
            value={
              mobileNumber
            }
            onChange={(e) =>
              setMobileNumber(
                e.target.value.replace(
                  /\D/g,
                  ''
                )
              )
            }
          />

          <div className="absolute right-3 top-3">
            {detecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Contact className="h-4 w-4" />
            )}
          </div>
        </div>
      </div>

      {/* RECENT */}
      {!mobileNumber && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">
              Recent Recharges
            </h3>

            {recentTransactions.length ===
              0 ? (
              <p className="text-sm text-muted-foreground">
                No recent history
              </p>
            ) : (
              recentTransactions.map(
                (txn) => (
                  <div
                    key={txn.id}
                    className="flex justify-between border rounded-lg p-3"
                  >
                    <div>
                      <p className="font-medium">
                        {
                          txn.mobile_number
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ₹
                        {
                          txn.amount
                        }
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setMobileNumber(
                          txn.mobile_number
                        );
                        setAmount(
                          txn.amount.toString()
                        );
                        setSelectedOperator(
                          txn.operator_id
                        );
                      }}
                    >
                      Repeat
                    </Button>
                  </div>
                )
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* FORM */}
      {mobileNumber && (
        <>
          <div className="grid grid-cols-2 gap-3">

            <div>
              <Label>
                Operator
              </Label>

              <Select
                value={
                  selectedOperator
                }
                onValueChange={
                  setSelectedOperator
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>

                <SelectContent>
                  {operators.map(
                    (op) => (
                      <SelectItem
                        key={op.id}
                        value={op.id}
                      >
                        {
                          op.name
                        }
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Circle
              </Label>

              <Select
                value={
                  selectedCircle
                }
                onValueChange={
                  setSelectedCircle
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>

                <SelectContent>
                  {circles.map(
                    (circle) => (
                      <SelectItem
                        key={
                          circle.id
                        }
                        value={
                          circle.id
                        }
                      >
                        {
                          circle.name
                        }
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount */}
          <div className="flex gap-2">
            <Input
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value
                )
              }
              placeholder="Amount"
            />

            <Button
              className="h-14 px-8 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all"
              onClick={handleProceedToConfirm}
              disabled={processing}
            >
              Proceed
            </Button>
          </div>

          {/* PLANS */}
          {selectedOperator && (
            <Tabs
              value={
                planCategory
              }
              onValueChange={
                setPlanCategory
              }
            >
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="all">
                  All
                </TabsTrigger>

                <TabsTrigger value="unlimited">
                  Unlimited
                </TabsTrigger>

                <TabsTrigger value="data">
                  Data
                </TabsTrigger>

                <TabsTrigger value="combo">
                  Combo
                </TabsTrigger>
              </TabsList>

              <TabsContent value={planCategory}>
                {loadingPlans ? (
                  <div className="py-5 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {plans.map(
                      (plan) => (
                        <Card
                          key={
                            plan.id
                          }
                          className={`cursor-pointer ${selectedPlan?.id ===
                            plan.id
                            ? 'border-blue-500'
                            : ''
                            }`}
                          onClick={() =>
                            handlePlanSelect(
                              plan
                            )
                          }
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between">
                              <span className="font-bold">
                                ₹
                                {
                                  plan.amount
                                }
                              </span>

                              <Badge>
                                {
                                  plan.validity
                                }
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground mt-2">
                              {
                                plan.description
                              }
                            </p>
                          </CardContent>
                        </Card>
                      )
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </>
      )}

      <KYCNudgeDialog
        isOpen={
          showKYCNudge
        }
        onClose={() =>
          setShowKYCNudge(
            false
          )
        }
        featureName="Recharge"
      />
    </div>
  );
}