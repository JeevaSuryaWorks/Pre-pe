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
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

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
  const handleRecharge = () => {
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
    setIsConfirmOpen(true);
  };

  const executeRecharge = async () => {
    setIsConfirmOpen(false);
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

  return (
    <div className="space-y-5">
      {IS_DEMO_MODE && (
        <div className="rounded-xl border bg-yellow-50 p-3 text-sm">
          Demo Mode Enabled
        </div>
      )}

      {/* MOBILE INPUT SECTION */}
      <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border shadow-sm">
        <Label className="text-sm font-semibold mb-2 block">
          Mobile Number
        </Label>

        <div className="relative">
          <Input
            className="text-lg font-bold tracking-wider h-12"
            placeholder="Enter 10 digit number"
            maxLength={10}
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
          />
          <div className="absolute right-3 top-3">
            {detecting ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : (
              <Contact className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </div>

      {/* RECENT OR PLAN SELECTION */}
      {mobileNumber.length < 10 ? (
        <Card className="border-none bg-muted/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Info className="h-4 w-4" />
              <h3 className="text-sm font-medium">Enter 10 digits to see plans</h3>
            </div>

            {recentTransactions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</p>
                {recentTransactions.map((txn) => (
                  <div key={txn.id} className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
                    <div>
                      <p className="font-bold text-sm">{txn.mobile_number}</p>
                      <p className="text-xs text-muted-foreground">₹{txn.amount}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-blue-600 font-bold"
                      onClick={() => setMobileNumber(txn.mobile_number)}
                    >
                      Repeat
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Operator</Label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>{op.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Circle</Label>
              <Select value={selectedCircle} onValueChange={setSelectedCircle}>
                <SelectTrigger className="h-11 rounded-xl">
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

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-3 font-bold text-muted-foreground">₹</span>
              <Input
                className="pl-7 h-12 text-lg font-bold rounded-xl"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
            <Button
              className="h-12 px-8 rounded-xl bg-blue-600 hover:bg-blue-700"
              onClick={handleRecharge}
              disabled={processing || !amount || !selectedOperator}
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
            </Button>
          </div>

          {selectedOperator && (
            <div className="space-y-3">
              <Label className="text-sm font-bold">Available Plans</Label>
              <Tabs value={planCategory} onValueChange={setPlanCategory}>
                <TabsList className="w-full bg-muted/50 p-1 rounded-xl h-11">
                  <TabsTrigger value="all" className="flex-1 rounded-lg">All</TabsTrigger>
                  <TabsTrigger value="unlimited" className="flex-1 rounded-lg">Unlimited</TabsTrigger>
                  <TabsTrigger value="data" className="flex-1 rounded-lg">Data</TabsTrigger>
                  <TabsTrigger value="combo" className="flex-1 rounded-lg">Combo</TabsTrigger>
                </TabsList>
                <TabsContent value={planCategory} className="mt-4">
                  {loadingPlans ? (
                    <div className="py-10 flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <p className="text-xs text-muted-foreground">Fetching best plans...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                      {plans.map((plan) => (
                        <Card
                          key={plan.id}
                          className={`cursor-pointer transition-all border-2 ${selectedPlan?.id === plan.id ? 'border-blue-500 bg-blue-50/30' : 'border-transparent'}`}
                          onClick={() => handlePlanSelect(plan)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xl font-black text-blue-600">₹{plan.amount}</span>
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">{plan.validity}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium line-clamp-2">{plan.description}</p>
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

      {/* CONFIRMATION DIALOG */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <CheckCircle2 className="text-green-500 h-6 w-6" />
              Confirm Recharge
            </DialogTitle>
            <DialogDescription>
              Please verify the details carefully.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Number</span>
                <span className="font-bold">{mobileNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Operator</span>
                <span className="font-medium">
                  {operators.find(o => o.id === selectedOperator)?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Circle</span>
                <span className="font-medium">
                  {circles.find(c => c.id === selectedCircle)?.name}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Amount</span>
                <span className="text-blue-600">₹{amount}</span>
              </div>
            </div>

            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Disclaimer:</strong> If you enter the wrong number, Pre-Pe is not responsible for the loss. Refunds are not possible for successful recharges to wrong numbers.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={executeRecharge} disabled={processing} className="flex-1 bg-blue-600 hover:bg-blue-700">
              {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm & Pay"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <KYCNudgeDialog
        isOpen={showKYCNudge}
        onClose={() => setShowKYCNudge(false)}
        featureName="Recharge"
      />
    </div>
  );
}