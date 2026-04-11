import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Contact, ChevronRight, FlaskConical } from 'lucide-react';
import { useLocation } from 'react-router-dom';

// [DEMO MODE] — Remove this line when KWIK is activated
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';
import { getOperators, getCircles, detectOperator } from '@/services/operator.service';
import { getPlans } from '@/services/plans.service';
import { processRecharge } from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import type { Operator, Circle, RechargePlan } from '@/types/recharge.types';
import { useKYC } from '@/hooks/useKYC';
import { KYCNudgeDialog } from '@/components/kyc/KYCNudgeDialog';
import { usePlanLimits } from '@/hooks/usePlanLimits';

export function MobileRechargeForm() {
  const { user } = useAuth();
  const { availableBalance, refetch: refetchWallet } = useWallet();
  const { isApproved } = useKYC();
  const { limits, checkRechargeLimit } = usePlanLimits();
  const { toast } = useToast();
  const location = useLocation();

  const [showKYCNudge, setShowKYCNudge] = useState(false);

  const [mobileNumber, setMobileNumber] = useState('');

  // Handle pre-filled state from navigation (e.g. from Saved page)
  useEffect(() => {
    if (location.state?.mobileNumber) {
      setMobileNumber(location.state.mobileNumber);
    }
  }, [location.state]);
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [selectedCircle, setSelectedCircle] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);
  const [planCategory, setPlanCategory] = useState<string>('all');

  const [operators, setOperators] = useState<Operator[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);

  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Load operators, circles, and history
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [ops, circs] = await Promise.all([
        getOperators('prepaid'),
        getCircles(),
      ]);
      setOperators(ops);
      setCircles(circs);

      if (user) {
        import('@/services/recharge.service').then(async (mod) => {
          const history = await mod.getTransactionHistory(user.id, 5, 'MOBILE_PREPAID');
          // Filter only SUCCESS transactions for recent list
          setRecentTransactions(history.filter(t => t.status === 'SUCCESS'));
        });
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  // Auto-detect operator when mobile number is entered
  useEffect(() => {
    const detect = async () => {
      if (mobileNumber.length === 10) {
        setDetecting(true);
        const result = await detectOperator(mobileNumber);
        if (result.status === 'SUCCESS' && result.data) {
          setSelectedOperator(result.data.operator.id);
          setSelectedCircle(result.data.circle.id);
          toast({
            title: 'Operator Detected',
            description: `${result.data.operator.name} - ${result.data.circle.name}`,
          });
        } else {
          toast({
            title: 'Detection Failed',
            description: 'Could not auto-detect operator. Please select manually.',
            variant: 'destructive',
          });
        }
        setDetecting(false);
      }
    };
    detect();
  }, [mobileNumber]);

  // Load plans when operator changes
  useEffect(() => {
    const loadPlans = async () => {
      if (selectedOperator) {
        console.log(`Fetching plans for Operator: ${selectedOperator}, Circle: ${selectedCircle}, Category: ${planCategory}`);
        setLoadingPlans(true);
        try {
          // If circle is not selected, default to something or handle it. 
          // For now, plans might require circle.
          const effectiveCircle = selectedCircle || '1'; // Default to Delhi/NCR if missing?

          const result = await getPlans(selectedOperator, effectiveCircle, planCategory);
          console.log('Plans fetch result:', result);

          if (result.status === 'SUCCESS' && Array.isArray(result.data)) {
            setPlans(result.data);
            if (result.data.length === 0) {
              toast({
                title: 'No plans found',
                description: 'Try changing the category or circle.',
                variant: 'default',
              });
            }
          } else {
            console.error('Plan fetch failed:', result);
            setPlans([]);
            toast({
              title: 'Could not fetch plans',
              description: result.message || 'Unknown error',
              variant: 'destructive',
            });
          }
        } catch (err) {
          console.error('Plan fetch error:', err);
          toast({
            title: 'Error fetching plans',
            description: 'Network or server error',
            variant: 'destructive',
          });
        }
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, [selectedOperator, selectedCircle, planCategory]);

  const handlePlanSelect = (plan: RechargePlan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount.toString());
  };

  const handleRecharge = async () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to sign in to make a recharge',
        variant: 'destructive',
      });
      return;
    }

    if (!isApproved) {
      setShowKYCNudge(true);
      return;
    }

    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: 'Invalid mobile number',
        description: 'Please enter a valid 10-digit mobile number',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedOperator || !amount) {
      toast({
        title: 'Missing details',
        description: 'Please select operator and enter amount',
        variant: 'destructive',
      });
      return;
    }

    const rechargeAmount = parseFloat(amount);
    
    // Check Plan Limits
    const limitCheck = await checkRechargeLimit();
    if (!limitCheck.allowed) {
      toast({
        title: 'Daily Limit Reached',
        description: `Your ${limits.name} allows ${limits.dailyRechargeLimit} recharges per day. Upgrade to Pro for unlimited recharges!`,
        variant: 'destructive',
      });
      return;
    }

    if (rechargeAmount > availableBalance) {
      toast({
        title: 'Insufficient balance',
        description: 'Please add money to your wallet',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    const result = await processRecharge(user.id, {
      mobile_number: mobileNumber,
      operator_id: selectedOperator,
      circle_id: selectedCircle,
      amount: rechargeAmount,
      plan_id: selectedPlan?.id,
    });

    setProcessing(false);

    if (result.status === 'SUCCESS') {
      // [DEMO MODE] — Update title when KWIK is activated (remove IS_DEMO_MODE check)
      toast({
        title: IS_DEMO_MODE ? '✅ Demo Recharge Done!' : 'Recharge Successful!',
        description: IS_DEMO_MODE
          ? `₹${rechargeAmount} demo recharge for ${mobileNumber} (no real transaction)`
          : `₹${rechargeAmount} recharge done for ${mobileNumber}`,
      });
      refetchWallet();
      setMobileNumber('');
      setAmount('');
      setSelectedPlan(null);
    } else if (result.status === 'PENDING') {
      toast({
        title: 'Recharge Processing',
        description: 'Your recharge is being processed. Check history for status.',
      });
      refetchWallet();
    } else {
      toast({
        title: 'Recharge Failed',
        description: result.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* [DEMO MODE] — Remove this entire block when KWIK is activated */}
      {IS_DEMO_MODE && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5 text-sm font-medium">
          <FlaskConical className="h-4 w-4 text-amber-600 shrink-0" />
          <span><strong>Demo Mode</strong> — Recharges are simulated. No real money is spent.</span>
        </div>
      )}
      {/* [DEMO MODE] ── End banner ── */}

      {/* Mobile Number Input Section */}
      <div className="relative">
        <Label htmlFor="mobile" className="absolute -top-2.5 left-4 bg-white px-1 text-xs text-slate-500 z-10">Mobile Number</Label>
        <div className="relative">
          <Input
            id="mobile"
            type="tel"
            maxLength={10}
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
            className="h-14 border-blue-900 border-2 rounded-xl text-lg pl-4 pr-12 focus-visible:ring-0 focus-visible:border-blue-700"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            {detecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Contact className="h-6 w-6 text-slate-500" />
            )}
          </div>
        </div>
      </div>

      {/* Recent Recharges Section */}
      {!mobileNumber ? (
        <div className="space-y-3">
          <h3 className="text-slate-600 font-medium text-lg">Recent Recharges</h3>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-50">
            {recentTransactions.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">No recent recharges found</div>
            ) : (
              recentTransactions.map((txn) => {
                const op = operators.find(o => o.id === txn.operator_id);
                return (
                  <div
                    key={txn.id}
                    className="p-4 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => {
                      if (txn.mobile_number) setMobileNumber(txn.mobile_number);
                      if (txn.operator_id) setSelectedOperator(txn.operator_id);
                      // We could pre-fill amount, but usually user might want a different plan? 
                      // User requested "Repeat", so let's pre-fill amount too.
                      if (txn.amount) setAmount(txn.amount.toString());
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-100 bg-slate-50 flex items-center justify-center">
                        {op?.logo ? (
                          <img src={op.logo} alt={op.name} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-xs font-bold text-slate-500">{op?.name?.[0] || '?'}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{txn.mobile_number}</p>
                        <p className="text-xs text-slate-400">
                          {op?.name || 'Unknown'} | ₹{txn.amount}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                      Repeat
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-4">
          {/* Operator & Circle Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Operator</Label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Circle</Label>
              <Select value={selectedCircle} onValueChange={setSelectedCircle}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {circles.map((circle) => (
                    <SelectItem key={circle.id} value={circle.id}>{circle.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-500">Amount (₹)</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-12"
              />
              <Button
                onClick={handleRecharge}
                disabled={processing || !selectedOperator || !amount}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Recharge'}
              </Button>
            </div>
          </div>

          {/* Plans Section */}
          {selectedOperator && (
            <div className="mt-4">
              <Tabs value={planCategory} onValueChange={setPlanCategory}>
                <TabsList className="w-full justify-start overflow-x-auto p-1 mb-2 bg-slate-50">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unlimited">Unlimited</TabsTrigger>
                  <TabsTrigger value="data">Data</TabsTrigger>
                  <TabsTrigger value="combo">Combo</TabsTrigger>
                </TabsList>

                <TabsContent value={planCategory}>
                  {loadingPlans ? (
                    <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-blue-500" /></div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {plans.map((plan) => (
                        <div
                          key={plan.id}
                          onClick={() => handlePlanSelect(plan)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:border-blue-500 hover:bg-blue-50 ${selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50/50' : 'border-slate-100 bg-white'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-lg text-slate-800">₹{plan.amount}</span>
                              <Badge variant="outline" className="ml-2 text-[10px] font-normal">{plan.validity}</Badge>
                            </div>
                            {selectedPlan?.id === plan.id && <Badge className="bg-blue-500 text-[10px]">Selected</Badge>}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{plan.description}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">{plan.data || 'No Data'}</Badge>
                          </div>
                        </div>
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
        featureName="Mobile Recharge"
      />
    </div>
  );
}
