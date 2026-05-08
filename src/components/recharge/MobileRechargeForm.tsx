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

      setProcessing(true);

      const result =
        await processRecharge(
          user.id,
          {
            mobile_number:
              mobileNumber,
            operator_id:
              selectedOperator,
            circle_id:
              selectedCircle,
            amount:
              rechargeAmount,
            plan_id:
              selectedPlan?.id,
          }
        );

      setProcessing(false);

      if (
        result.status ===
        'SUCCESS'
      ) {
        toast({
          title:
            'Recharge Successful',
          description: `₹${rechargeAmount} recharge done`,
        });

        refetch();

        setMobileNumber('');
        setAmount('');
        setSelectedPlan(
          null
        );
      } else if (
        result.status ===
        'PENDING'
      ) {
        toast({
          title:
            'Recharge Processing',
          description:
            'Please wait while recharge completes',
        });

        refetch();
      } else {
        toast({
          title:
            'Recharge Failed',
          description:
            result.message,
          variant:
            'destructive',
        });
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
              onClick={
                handleRecharge
              }
              disabled={
                processing
              }
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Recharge'
              )}
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