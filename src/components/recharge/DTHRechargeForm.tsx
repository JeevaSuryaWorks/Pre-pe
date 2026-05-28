import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tv, CheckCircle2 } from 'lucide-react';
import { BrandLoader, PrePeSpinner } from '@/components/ui/BrandLoader';
import { getOperators } from '@/services/operator.service';
import { getPlans } from '@/services/plans.service';
import { processRecharge } from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import type { Operator, RechargePlan } from '@/types/recharge.types';
import { fetchDTHCustomerDetails, DTHCustomerInfoResponse } from '@/services/kwikApiService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function DTHRechargeForm() {
  const { user } = useAuth();
  const { availableBalance, refetch: refetchWallet } = useWallet();
  const { toast } = useToast();

  const [dthId, setDthId] = useState('');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<RechargePlan | null>(null);

  const [operators, setOperators] = useState<Operator[]>([]);
  const [plans, setPlans] = useState<RechargePlan[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Customer Info State
  const [customerInfo, setCustomerInfo] = useState<DTHCustomerInfoResponse['response']['info'][0] | null>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Fetch Customer Info when ID is entered (debounced/on-blur) or manually
  const fetchCustomerInfo = async () => {
    if (!selectedOperator || dthId.length < 8) return;

    setFetchingInfo(true);
    const result = await fetchDTHCustomerDetails(selectedOperator, dthId);
    setFetchingInfo(false);

    if (result.status === 'SUCCESS' && result.response && result.response.info && result.response.info.length > 0) {
      setCustomerInfo(result.response.info[0]);
    } else {
      setCustomerInfo(null);
      // Optional: don't error toast immediately as they might still be typing
    }
  };

  // Load DTH operators
  useEffect(() => {
    const loadOperators = async () => {
      setLoading(true);
      const ops = await getOperators('dth');
      setOperators(ops);

      // Auto-select operator from URL query params
      const params = new URLSearchParams(window.location.search);
      const opId = params.get('operator');
      if (opId) {
        // Find operator by ID or similar matching if needed, assuming direct ID match for now
        // or finding by ID from the loaded ops
        const matched = ops.find(o => o.id === opId || o.code.toLowerCase() === opId.toLowerCase());
        if (matched) setSelectedOperator(matched.id);
      }

      setLoading(false);
    };
    loadOperators();
  }, []);

  // Load plans when operator changes
  useEffect(() => {
    const loadPlans = async () => {
      if (selectedOperator) {
        setLoadingPlans(true);
        const result = await getPlans(selectedOperator);
        if (result.status === 'SUCCESS') {
          setPlans(result.data || []);
        }
        setLoadingPlans(false);
      }
    };
    loadPlans();
  }, [selectedOperator]);

  const handlePlanSelect = (plan: RechargePlan) => {
    setSelectedPlan(plan);
    setAmount(plan.amount.toString());
  };

  const validateDthInput = () => {
    const op = operators.find(o => o.id === selectedOperator);
    if (!op) return false;

    const code = op.code.toUpperCase();

    // Mobile Validation
    if (!/^\d{10}$/.test(registeredMobile)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Registered mobile number must be 10 digits",
        variant: "destructive"
      });
      return false;
    }

    // ID Validation Logic
    let isValidId = false;
    let errorMsg = "Invalid Subscriber ID";

    if (code.includes('AIRTEL')) {
      // Airtel Digital TV: 10 digits
      isValidId = /^\d{10}$/.test(dthId);
      errorMsg = "Airtel Digital TV ID must be 10 digits";
    } else if (code.includes('DISH')) {
      // Dish TV: 10 or 11 digits
      isValidId = /^\d{10,11}$/.test(dthId);
      errorMsg = "Dish TV ID must be 10 or 11 digits";
    } else if (code.includes('SUN')) { // Check actual code for Sun Direct
      // Sun Direct TV: 11 digits
      isValidId = /^\d{11}$/.test(dthId);
      errorMsg = "Sun Direct TV ID must be 11 digits";
    } else if (code.includes('TATA')) {
      // Tata Play: 10 digits
      isValidId = /^\d{10}$/.test(dthId);
      errorMsg = "Tata Play Subscriber ID must be 10 digits";
    } else if (code.includes('D2H') || code.includes('VIDEOCON')) {
      // Videocon d2h: 10 digits
      isValidId = /^\d{10}$/.test(dthId);
      errorMsg = "Videocon d2h ID must be 10 digits";
    } else {
      // Default fallback (e.g. 8-12 digits)
      isValidId = /^\d{8,12}$/.test(dthId);
    }

    if (!isValidId) {
      toast({
        title: "Invalid ID",
        description: errorMsg,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleRechargeClick = () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to sign in to make a recharge',
        variant: 'destructive',
      });
      return;
    }

    if (!validateDthInput()) return;

    if (!selectedOperator || !amount) {
      toast({
        title: 'Missing details',
        description: 'Please select operator and enter amount',
        variant: 'destructive',
      });
      return;
    }

    // Show confirmation dialog instead of direct processing
    setShowConfirm(true);
  };

  const procesConfirmedRecharge = async () => {
    setShowConfirm(false);
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to sign in to make a recharge',
        variant: 'destructive',
      });
      return;
    }

    if (!validateDthInput()) return;

    if (!selectedOperator || !amount) {
      toast({
        title: 'Missing details',
        description: 'Please select operator and enter amount',
        variant: 'destructive',
      });
      return;
    }

    const rechargeAmount = parseFloat(amount);
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
      dth_id: dthId,
      operator_id: selectedOperator,
      amount: rechargeAmount,
      plan_id: selectedPlan?.id,
      mobile_number: registeredMobile, // Pass registered mobile for record keeping
    });

    setProcessing(false);

    if (result.status === 'SUCCESS') {
      toast({
        title: 'Recharge Successful!',
        description: `₹${rechargeAmount} recharge done for DTH ID ${dthId}`,
      });
      refetchWallet();
      setDthId('');
      setRegisteredMobile('');
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
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <BrandLoader size="md" />
        </CardContent>
      </Card>
    );
  }

  // Helper to get label for ID based on operator
  const getIdLabel = () => {
    const op = operators.find(o => o.id === selectedOperator);
    if (op?.code.includes('TATA')) return 'Subscriber ID';
    if (op?.name.includes('Airtel')) return 'Customer ID';
    if (op?.name.includes('Dish')) return 'VC Number / Customer ID';
    return 'Subscriber ID / Customer ID';
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5" />
            DTH Recharge
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operator */}
            <div className="space-y-2">
              <Label>DTH Operator</Label>
              <Select value={selectedOperator} onValueChange={setSelectedOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Select DTH operator" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* DTH ID */}
            <div className="space-y-2">
              <Label htmlFor="dthId">{selectedOperator ? getIdLabel() : 'Subscriber ID / Customer ID'}</Label>
              <Input
                id="dthId"
                type="text"
                placeholder="Enter ID"
                value={dthId}
                onChange={(e) => setDthId(e.target.value.replace(/\D/g, ''))}
                onBlur={fetchCustomerInfo}
                className="font-mono"
                maxLength={12}
              />
            </div>

            {/* Customer Info Display */}
            {fetchingInfo ? (
              <div className="text-sm text-muted-foreground animate-pulse">Fetching customer details...</div>
            ) : customerInfo ? (
              <div className="col-span-1 md:col-span-2 bg-muted/50 p-3 rounded-md text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{customerInfo.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-medium text-green-600">₹{customerInfo.balance}</span>
                </div>
                {customerInfo.planname && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current Plan:</span>
                    <span className="font-medium">{customerInfo.planname}</span>
                  </div>
                )}
              </div>
            ) : null}

            {/* Registered Mobile Number */}
            <div className="space-y-2">
              <Label htmlFor="regMobile">Registered Mobile Number</Label>
              <Input
                id="regMobile"
                type="tel"
                placeholder="Enter Registered Mobile Number"
                value={registeredMobile}
                onChange={(e) => setRegisteredMobile(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
              />
            </div>
          </div>

          {/* Amount & Recharge Button */}
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <Button
              onClick={handleRechargeClick}
              disabled={processing || !dthId || !selectedOperator || !amount}
              className="w-full sm:w-auto px-8"
            >
              {processing ? (
                <>
                  <PrePeSpinner className="h-4 w-4" />
                  Processing...
                </>
              ) : (
                `Recharge ₹${amount || '0'}`
              )}
            </Button>
          </div>

          {user && (
            <p className="text-sm text-muted-foreground">
              Wallet Balance: <span className="font-semibold text-foreground">₹{availableBalance.toFixed(2)}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      {selectedOperator && (
        <Card>
          <CardHeader>
            <CardTitle>Available Packs</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <BrandLoader size="md" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No packs found for this operator
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`cursor-pointer transition-all hover:border-primary ${selectedPlan?.id === plan.id ? 'border-primary ring-2 ring-primary/20' : ''
                      }`}
                    onClick={() => handlePlanSelect(plan)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl font-bold text-primary">₹{plan.amount}</span>
                        <Badge variant="secondary">{plan.validity}</Badge>
                      </div>
                      <p className="text-sm text-foreground">{plan.description}</p>
                      {selectedPlan?.id === plan.id && (
                        <div className="mt-2 flex items-center text-sm text-primary">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Selected
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm DTH Recharge</DialogTitle>
            <DialogDescription>
              Please review the details before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Operator</span>
                <span className="font-medium">{operators.find(o => o.id === selectedOperator)?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subscriber ID</span>
                <span className="font-medium">{dthId}</span>
              </div>
              {customerInfo && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{customerInfo.customerName}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registered Mobile</span>
                <span className="font-medium">{registeredMobile || 'N/A'}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between items-center">
                <span className="font-semibold">Recharge Amount</span>
                <span className="text-xl font-bold text-primary">₹{amount}</span>
              </div>
            </div>

            {parseFloat(amount) > availableBalance && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                ⚠️ Insufficient wallet balance. Please top up first.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={procesConfirmedRecharge} disabled={processing || parseFloat(amount) > availableBalance}>
              {processing ? <PrePeSpinner className="h-4 w-4" /> : null}
              Confirm & Pay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
