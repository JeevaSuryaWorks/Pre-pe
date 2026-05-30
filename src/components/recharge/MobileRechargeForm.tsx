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
  Trophy,
  Star,
  Sparkles
} from 'lucide-react';
import { BrandLoader, PrePeSpinner } from '@/components/ui/BrandLoader';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getOperators,
  getCircles,
  detectOperator,
} from '@/services/operator.service';
import { getPlans, getROffer } from '@/services/plans.service';
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
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import {
  getAutonomousRewardsConfig,
  getPointsForRechargeAmount,
  triggerAutonomousRechargeRewards,
} from '@/services/rewards.service';
import { Capacitor } from '@capacitor/core';
import { fetchTruecallerProfileSimulated, type TruecallerProfile } from '@/services/truecaller.service';

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

const getAISuggestedPlans = (operatorId: string): RechargePlan[] => {
  const defaults: Record<string, RechargePlan[]> = {
    '1': [ // Airtel
      { id: 'ai-a1', operator_id: '1', amount: 239, validity: '28 Days', description: 'Unlimited Calls | 1.5GB/Day | 100 SMS/Day | Free HelloTunes', category: 'unlimited' },
      { id: 'ai-a2', operator_id: '1', amount: 299, validity: '28 Days', description: 'Unlimited Calls | 2GB/Day | 100 SMS/Day | Apollo 24|7 Circle', category: 'unlimited' },
      { id: 'ai-a-d1', operator_id: '1', amount: 19, validity: '1 Day', description: '1GB High Speed Data Booster Voucher', category: 'data' },
      { id: 'ai-a-d2', operator_id: '1', amount: 58, validity: '1 Day', description: '3GB High Speed Extra Data Booster Pack', category: 'data' },
      { id: 'ai-a-c1', operator_id: '1', amount: 155, validity: '24 Days', description: 'Unlimited Calls | 1GB Total Data | 300 SMS | Free Hellotunes', category: 'combo' },
      { id: 'ai-a-o1', operator_id: '1', amount: 359, validity: '28 Days', description: 'Unlimited Calls | 2.5GB/Day | Disney+ Hotstar Mobile Subscription', category: 'ott' },
      { id: 'ai-a-5g', operator_id: '1', amount: 699, validity: '56 Days', description: 'Unlimited Calls | 3GB/Day | True Unlimited 5G Data | Wynk Premium', category: '5g' },
      { id: 'ai-a-r1', operator_id: '1', amount: 649, validity: '1 Day', description: 'International Roaming: 100 Mins Voice, 500MB Data Pack', category: 'roaming' },
      { id: 'ai-a-t1', operator_id: '1', amount: 10, validity: 'Unlimited', description: 'Topup Voucher: ₹7.47 Talktime Balance', category: 'topup' },
      { id: 'ai-a-t2', operator_id: '1', amount: 100, validity: 'Unlimited', description: 'Topup Voucher: ₹81.75 Talktime Balance', category: 'topup' },
    ],
    '3': [ // Jio
      { id: 'ai-j1', operator_id: '3', amount: 239, validity: '28 Days', description: 'Unlimited Voice | 1.5GB/Day | 100 SMS/Day | JioCinema', category: 'unlimited' },
      { id: 'ai-j2', operator_id: '3', amount: 299, validity: '28 Days', description: 'Unlimited Voice | 2GB/Day | Unlimited 5G Data | JioCloud', category: 'unlimited' },
      { id: 'ai-j-d1', operator_id: '3', amount: 15, validity: 'Active Plan', description: '1GB High Speed Data Booster Voucher', category: 'data' },
      { id: 'ai-j-d2', operator_id: '3', amount: 25, validity: 'Active Plan', description: '2GB High Speed Data Booster Pack', category: 'data' },
      { id: 'ai-j-c1', operator_id: '3', amount: 155, validity: '28 Days', description: 'Unlimited Calls | 2GB Total Data | 300 SMS | Jio Apps', category: 'combo' },
      { id: 'ai-j-o1', operator_id: '3', amount: 398, validity: '28 Days', description: 'Unlimited Voice | 2GB/Day | Disney+ Hotstar & Jio Cinema', category: 'ott' },
      { id: 'ai-j-5g', operator_id: '3', amount: 666, validity: '84 Days', description: 'Unlimited Voice | 1.5GB/Day | True Unlimited 5G High Speed Data', category: '5g' },
      { id: 'ai-j-r1', operator_id: '3', amount: 1102, validity: '28 Days', description: 'International Roaming: 100 Mins Voice, 2GB Data Roaming Pack', category: 'roaming' },
      { id: 'ai-j-t1', operator_id: '3', amount: 10, validity: 'Unlimited', description: 'Topup Voucher: ₹7.47 Talktime Balance', category: 'topup' },
      { id: 'ai-j-t2', operator_id: '3', amount: 100, validity: 'Unlimited', description: 'Topup Voucher: ₹81.75 Talktime Balance', category: 'topup' },
    ],
    '4': [ // Vi
      { id: 'ai-v1', operator_id: '4', amount: 239, validity: '28 Days', description: 'Unlimited Calls | 1.5GB/Day | Binge All Night (12AM-6AM)', category: 'unlimited' },
      { id: 'ai-v2', operator_id: '4', amount: 299, validity: '28 Days', description: 'Unlimited Calls | 2GB/Day | Weekend Data Rollover & Binge All Night', category: 'unlimited' },
      { id: 'ai-v-d1', operator_id: '4', amount: 19, validity: '1 Day', description: '1GB Extra High Speed Data Booster Pack', category: 'data' },
      { id: 'ai-v-d2', operator_id: '4', amount: 58, validity: '28 Days', description: '3GB Data Pack with 28 Days Active Validity', category: 'data' },
      { id: 'ai-v-c1', operator_id: '4', amount: 179, validity: '28 Days', description: 'Unlimited Calls | 2GB Total Data | 300 SMS | Vi Movies & TV', category: 'combo' },
      { id: 'ai-v-o1', operator_id: '4', amount: 369, validity: '28 Days', description: 'Unlimited Calls | 2GB/Day | Disney+ Hotstar Mobile Subscription', category: 'ott' },
      { id: 'ai-v-5g', operator_id: '4', amount: 479, validity: '56 Days', description: 'Unlimited Calls | 1.5GB/Day | True Unlimited 5G High Speed Data', category: '5g' },
      { id: 'ai-v-r1', operator_id: '4', amount: 599, validity: '1 Day', description: 'Vi International Roaming: 50 Mins, 1GB Data Pack', category: 'roaming' },
      { id: 'ai-v-t1', operator_id: '4', amount: 10, validity: 'Unlimited', description: 'Topup Voucher: ₹7.47 Talktime Balance', category: 'topup' },
      { id: 'ai-v-t2', operator_id: '4', amount: 100, validity: 'Unlimited', description: 'Topup Voucher: ₹81.75 Talktime Balance', category: 'topup' },
    ],
    '2': [ // BSNL
      { id: 'ai-b1', operator_id: '2', amount: 107, validity: '35 Days', description: '3GB Data | 200 Mins Voice Calls | BSNL Tunes included', category: 'combo' },
      { id: 'ai-b2', operator_id: '2', amount: 197, validity: '70 Days', description: 'Unlimited Voice | 2GB/Day (Speed reduced to 40kbps after)', category: 'unlimited' },
      { id: 'ai-b-d1', operator_id: '2', amount: 97, validity: '15 Days', description: 'Unlimited High Speed 3G/4G Data Voucher Pack', category: 'data' },
      { id: 'ai-b-d2', operator_id: '2', amount: 151, validity: '28 Days', description: '40GB High Speed Data Booster Pack', category: 'data' },
      { id: 'ai-b-c1', operator_id: '2', amount: 397, validity: '150 Days', description: 'Unlimited Voice & 2GB/Day for 30 days | Plan validity 150 days', category: 'combo' },
      { id: 'ai-b-o1', operator_id: '2', amount: 269, validity: '28 Days', description: 'Unlimited Voice | 2GB/Day | BSNL Eros Now Entertainment Bundle', category: 'ott' },
      { id: 'ai-b-5g', operator_id: '2', amount: 797, validity: '300 Days', description: 'Unlimited Voice & 2GB/Day for 60 days | 300 Days validity pack', category: '5g' },
      { id: 'ai-b-r1', operator_id: '2', amount: 899, validity: '7 Days', description: 'BSNL International Roaming: 30 Mins, 1GB Data Roaming Pack', category: 'roaming' },
      { id: 'ai-b-t1', operator_id: '2', amount: 10, validity: 'Unlimited', description: 'Topup Voucher: ₹7.47 Talktime Balance', category: 'topup' },
      { id: 'ai-b-t2', operator_id: '2', amount: 100, validity: 'Unlimited', description: 'Topup Voucher: ₹81.75 Talktime Balance', category: 'topup' },
    ],
  };

  return defaults[operatorId] || [
    { id: 'ai-d1', operator_id: operatorId, amount: 239, validity: '28 Days', description: 'Unlimited Calls + 1.5GB/Day High Speed 4G Data', category: 'unlimited' },
    { id: 'ai-d2', operator_id: operatorId, amount: 299, validity: '28 Days', description: 'Unlimited Calls + 2GB/Day High Speed 4G Data', category: 'unlimited' },
  ];
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
  const [suggestedPlans, setSuggestedPlans] = useState<RechargePlan[]>([]);
  const [loadingSuggested, setLoadingSuggested] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [rewardsConfig, setRewardsConfig] = useState<any>(null);
  const [upiVpa, setUpiVpa] = useState(() => {
    const vpas = ['8668075429@okbizaxis'];
    return vpas[Math.floor(Math.random() * vpas.length)];
  });
  
  const [loading, setLoading] = useState(true);
  const [truecallerProfile, setTruecallerProfile] = useState<TruecallerProfile | null>(null);
  const [fetchingTruecaller, setFetchingTruecaller] = useState(false);
  
  useEffect(() => {
    const loadRewards = async () => {
      try {
        const config = await getAutonomousRewardsConfig();
        setRewardsConfig(config);
      } catch (err) {
        console.warn("Failed to load rewards config inside MobileRechargeForm:", err);
      }
    };
    loadRewards();
  }, []);
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
    const cleaned = val.replace(/\D/g, '').slice(-10);
    // Format: 00000 00000
    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = cleaned.slice(0, 5) + ' ' + cleaned.slice(5);
    }
    setMobileNumber(formatted);
  };

  useEffect(() => {
    // Read prefilled phone number from location search or state
    const params = new URLSearchParams(location.search);
    const queryPhone = params.get('phone') || location.state?.mobileNumber;
    if (queryPhone) {
      const cleaned = queryPhone.replace(/\D/g, '').slice(-10);
      if (cleaned.length === 10) {
        handleMobileChange(cleaned);
      }
    }
  }, [location]);

  const handleOpenContacts = async () => {
    // Try browser/webview built-in native Contact Picker API
    if ('contacts' in navigator && 'ContactsManager' in window) {
      try {
        const props = ['name', 'tel'];
        const opts = { multiple: false };
        // @ts-ignore
        const contacts = await navigator.contacts.select(props, opts);
        if (contacts && contacts.length > 0) {
          const contact = contacts[0];
          const rawPhone = contact.tel?.[0] || '';
          const cleaned = rawPhone.replace(/\D/g, '').slice(-10); // get last 10 digits
          if (cleaned.length === 10) {
            handleMobileChange(cleaned);
            toast({
              title: "Contact Selected",
              description: `Loaded number for ${contact.name?.[0] || 'Selected Contact'}.`,
            });
            return;
          } else {
            toast({
              title: "Invalid Mobile Number",
              description: "Selected contact does not have a valid 10-digit mobile number.",
              variant: "destructive",
            });
          }
        }
      } catch (err: any) {
        console.warn('Native Contact Picker aborted/failed:', err);
        if (err.name !== 'AbortError') {
          toast({
            title: "Contacts Permission",
            description: "Unable to access phone contacts. Please grant Contacts permission in system settings.",
            variant: "destructive",
          });
        }
      }
    } else {
      toast({
        title: "Native Contact Picker Only",
        description: "Built-in system contact chooser is only available on native mobile devices.",
      });
    }
  };

  useEffect(() => {
    const rawNumber = mobileNumber.replace(/\s/g, '');
    if (rawNumber.length === 10) {
      const run = async () => {
        setDetecting(true);
        setFetchingTruecaller(true);
        setTruecallerProfile(null);
        try {
          const result = await detectOperator(rawNumber);
          if (result.status === 'SUCCESS' && result.data) {
            setSelectedOperator(result.data.operator.id);
            setSelectedCircle(result.data.circle.id);
            
            // Truecaller async lookup
            fetchTruecallerProfileSimulated(rawNumber).then((profile) => {
              setTruecallerProfile(profile);
              setFetchingTruecaller(false);
            }).catch(() => {
              setFetchingTruecaller(false);
            });

            setTimeout(() => setStep('details'), 500);
          } else {
            setFetchingTruecaller(false);
          }
        } catch (e) {
          setDetecting(false);
          setFetchingTruecaller(false);
        } finally {
          setDetecting(false);
        }
      };
      run();
    } else {
      setTruecallerProfile(null);
      setFetchingTruecaller(false);
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

  useEffect(() => {
    if (!selectedOperator || !mobileNumber || step !== 'details') return;
    const loadSuggested = async () => {
      setLoadingSuggested(true);
      const cleanNumber = mobileNumber.replace(/\s+/g, '');
      try {
        const result = await getROffer(selectedOperator, cleanNumber);
        if (result.status === 'SUCCESS' && result.data && result.data.length > 0) {
          setSuggestedPlans(result.data);
        } else {
          // Fallback to static AI suggestions if no R-offers are returned or not supported (e.g. Jio/BSNL)
          setSuggestedPlans(getAISuggestedPlans(selectedOperator));
        }
      } catch (err) {
        setSuggestedPlans(getAISuggestedPlans(selectedOperator));
      } finally {
        setLoadingSuggested(false);
      }
    };
    loadSuggested();
  }, [selectedOperator, mobileNumber, step]);

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
        if (result.upi_vpa) {
          setUpiVpa(result.upi_vpa);
        }
        
        // Open UPI Intent on mobile, or show QR on desktop
        if (isMobile) {
          if (Capacitor.isNativePlatform()) {
            window.open(result.intent_url, '_system');
          } else {
            window.location.href = result.intent_url;
          }
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
        // Trigger Autonomous Recharge Rewards asynchronously
        try {
          await triggerAutonomousRechargeRewards(user!.id, parseFloat(amount));
        } catch (rewErr) {
          console.error("Failed to credit autonomous recharge rewards:", rewErr);
        }

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
        <BrandLoader size="md" />
      </div>
    );
  }

  if (isTopupFlow && processing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-6 animate-in fade-in duration-500">
        <div className="relative h-20 w-20 mx-auto">
          <BrandLoader size="md" />
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
            {processing ? <PrePeSpinner className="h-6 w-6" /> : "SECURE PAYMENT"}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="flex-1 flex flex-col space-y-4 animate-in fade-in slide-in-from-right-8 duration-500 w-full relative">
        <div 
          className="sticky bg-white/98 backdrop-blur-md pb-4 pt-2 space-y-4 shadow-sm -mx-4 px-4 border-b border-slate-200/50"
          style={{ position: 'sticky', top: '60px', zIndex: 30 }}
        >
          {/* Card containing Logo, Number, Truecaller Name lookup, and Change button */}
          <div className="flex items-center justify-between bg-white/95 backdrop-blur-md p-3 rounded-[24px] border border-slate-100 shadow-sm w-full">
            <div className="flex items-center gap-3 px-1">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm p-1.5 overflow-hidden">
                {selectedOperator && OPERATOR_LOGOS[selectedOperator] ? (
                  <img 
                     src={OPERATOR_LOGOS[selectedOperator]} 
                     alt="Operator Logo" 
                     className="w-full h-full object-contain animate-in zoom-in-50 duration-300"
                     onError={(e) => { 
                       (e.target as any).style.display = 'none'; 
                       if ((e.target as any).nextSibling) {
                         (e.target as any).nextSibling.style.display = 'block';
                       }
                     }} 
                   />
                ) : null}
                <Phone className={`w-4 h-4 text-blue-600 ${selectedOperator && OPERATOR_LOGOS[selectedOperator] ? 'hidden' : 'block'}`} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-black text-slate-900 tracking-tighter leading-none">{mobileNumber}</p>
                  {truecallerProfile && (
                    <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[8px] font-black border border-blue-100/50 animate-in zoom-in duration-300 shadow-3xs uppercase tracking-wider">
                      ⚡ TC Verified
                    </span>
                  )}
                  {fetchingTruecaller && (
                    <PrePeSpinner className="w-3 h-3" />
                  )}
                </div>
                {truecallerProfile ? (
                  <div className="space-y-0.5 mt-1">
                    <p className="text-[11px] font-black text-[#0087FF] leading-none">
                      {truecallerProfile.name.first} {truecallerProfile.name.last}
                    </p>
                    <p className="text-[10.5px] text-[#0087FF] font-extrabold leading-none flex items-center gap-1 uppercase tracking-wider mt-1">
                      ⚠️ Name may be inaccurate
                    </p>
                  </div>
                ) : (
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Select a Plan</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('number')} className="h-8 rounded-lg text-blue-600 text-xs font-bold hover:bg-blue-50 px-3">Change</Button>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full px-1">
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

          {/* Unified Search & Custom Amount Input Box */}
          <div className="relative group w-full px-1">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[30px] blur-2xl opacity-5 group-focus-within:opacity-10 transition duration-1000"></div>
            <div className="relative bg-white border-2 border-slate-100 rounded-[24px] p-4 focus-within:border-blue-500 transition-all shadow-md shadow-slate-100/5 w-full">
              <Label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 block ml-1">Search Plans or Enter Amount</Label>
              <div className="flex items-center gap-3 h-10 w-full">
                {/^\d+$/.test(planSearchQuery) ? (
                  <span className="text-xl font-black text-blue-600 select-none shrink-0 animate-in zoom-in-50 duration-200">₹</span>
                ) : (
                  <Search className="h-5 w-5 text-slate-400 shrink-0" />
                )}
                <div className="w-px h-5 bg-slate-100 shrink-0" />
                <input
                  type="text"
                  className="border-none p-0 h-full text-xl font-bold tracking-tight focus:outline-none placeholder:text-slate-200 bg-transparent flex-1 min-w-0 font-sans"
                  placeholder="Search plan or enter amount (e.g. 2GB, 239)"
                  value={planSearchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPlanSearchQuery(val);
                    
                    const isNumber = /^\d+$/.test(val);
                    if (isNumber && parseFloat(val) > 0) {
                      setAmount(val);
                      setSelectedPlan({
                        id: 'custom',
                        amount: parseFloat(val) || 0,
                        validity: 'As per operator',
                        description: 'Custom Recharge Amount',
                        category: 'custom'
                      } as any);
                    } else {
                      setAmount("");
                      if (selectedPlan?.id === 'custom') {
                        setSelectedPlan(null);
                      }
                    }
                  }}
                />
                {planSearchQuery && (
                  <button
                    onClick={() => {
                      setPlanSearchQuery("");
                      setAmount("");
                      if (selectedPlan?.id === 'custom') {
                        setSelectedPlan(null);
                      }
                    }}
                    className="w-6 h-6 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Proceed Button for custom amount */}
        {amount && parseFloat(amount) > 0 && (
          <div className="shrink-0 px-1 w-full animate-in slide-in-from-bottom-2 duration-300">
            <Button
              className="w-full h-14 rounded-2xl text-md font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
              onClick={() => {
                if (!selectedPlan || selectedPlan.id !== 'custom') {
                  setSelectedPlan({
                    id: 'custom',
                    amount: parseFloat(amount),
                    validity: 'As per operator',
                    description: 'Custom Recharge Amount',
                    category: 'custom'
                  } as any);
                }
                setStep('confirm');
              }}
            >
              PROCEED TO PAY ₹{amount}
            </Button>
          </div>
        )}

        <div className="flex flex-col w-full">
          {/* Suggested Plans */}
          {!planSearchQuery && (() => {
            if (loadingSuggested) {
              return (
                <div className="mb-6 shrink-0 animate-pulse">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20 animate-spin" />
                      Resolving personalized offers...
                    </h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="min-w-[155px] h-[120px] rounded-2xl bg-slate-100 border border-slate-200/50 relative overflow-hidden" />
                    ))}
                  </div>
                </div>
              );
            }

            const allSuggested = suggestedPlans;
            const suggested = planCategory === 'all'
              ? allSuggested
              : allSuggested.filter(plan => plan.category === planCategory || plan.category === 'special');
            
            if (suggested.length === 0) return null;

            return (
              <div className="mb-6 shrink-0">
                 <div className="flex items-center justify-between mb-3 px-1">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                     Suggested For You
                   </h3>
                   <span className="text-[8px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full tracking-tighter">AI Optimized</span>
                 </div>
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1">
                   {suggested.map((plan, idx) => (
                     <div 
                       key={`suggested-${plan.id}`}
                       onClick={() => handlePlanSelect(plan)}
                       className={`min-w-[155px] p-4 rounded-2xl text-white shadow-lg active:scale-95 transition-all relative overflow-hidden group ${
                         idx % 2 === 0 ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-indigo-600 to-violet-700'
                       }`}
                     >
                       <div className="absolute top-[-20%] right-[-10%] w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
                       <div className="flex justify-between items-start mb-2 relative z-10">
                         <div className="flex flex-col">
                           <span className="text-xl font-black tracking-tighter">₹{plan.amount}</span>
                         </div>
                         <Star className="w-3 h-3 text-white/50 fill-white/20" />
                       </div>
                       <p className="text-[9.5px] font-bold leading-snug opacity-95 line-clamp-2 mb-2.5 min-h-[28px] relative z-10">{plan.description}</p>
                       <div className="flex justify-between items-center relative z-10">
                         <span className="text-[8px] font-black uppercase tracking-widest opacity-70">{plan.validity}</span>
                         <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                           <ChevronRight className="w-3 h-3" />
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            );
          })()}

          {/* Quick Filter Chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1 shrink-0 px-1">
             {['1.5GB', '2GB', '28 Days', '84 Days', 'Unlimited'].map(chip => (
               <button 
                 key={chip}
                 onClick={() => {
                   const nextVal = planSearchQuery === chip ? "" : chip;
                   setPlanSearchQuery(nextVal);
                   setAmount("");
                   if (selectedPlan?.id === 'custom') {
                     setSelectedPlan(null);
                   }
                 }}
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
            <TabsList className="flex bg-slate-100/50 p-1 rounded-[18px] gap-1 mb-4 h-11 shrink-0 w-full overflow-x-auto no-scrollbar justify-start">
              {[
                { id: 'all', label: 'All' },
                { id: 'unlimited', label: 'Unlimited' },
                { id: 'data', label: 'Data (GB)' },
                { id: 'combo', label: 'Validity' },
                { id: 'ott', label: 'OTT / Media' },
                { id: '5g', label: 'True 5G' },
                { id: 'roaming', label: 'Roaming' },
                { id: 'topup', label: 'Talktime' }
              ].map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="px-4 rounded-[14px] text-[9px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-md transition-all h-full shrink-0"
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={planCategory} className="mt-0 w-full">
              <div className="grid gap-3 pr-1 pb-2 w-full">
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
                    .map((plan, idx) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => handlePlanSelect(plan)}
                    className="p-5 rounded-[28px] border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group active:scale-[0.98] w-full"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black tracking-tighter text-slate-900 leading-none">₹{plan.amount}</span>
                        </div>
                        <span className="text-[9px] font-black text-blue-600 mt-1 uppercase tracking-widest">{plan.validity}</span>
                      </div>
                      <div className="w-7 h-7 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-normal line-clamp-2">{plan.description}</p>
                  </motion.div>
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
                  <PrePeSpinner className="h-5 w-5" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenContacts}
                  className="w-10 h-10 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center transition-all active:scale-95 focus:outline-none cursor-pointer border border-blue-100 shadow-sm shadow-blue-50/50"
                  title="Select Contact"
                >
                  <Contact className="h-5 w-5 text-blue-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {profile?.phone && (
        <div className="shrink-0 w-full mb-2 animate-in fade-in slide-in-from-bottom duration-500">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3">My Number</h3>
          <div
            onClick={() => handleMobileChange(profile.phone)}
            className="group flex items-center gap-5 p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border border-blue-100/70 rounded-[28px] hover:border-blue-300 hover:shadow-xl transition-all cursor-pointer w-full active:scale-98"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-[18px] flex items-center justify-center text-white font-black shrink-0 shadow-md shadow-blue-100">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-lg font-black text-slate-800 tracking-tight leading-none truncate">
                {profile.full_name || user?.user_metadata?.full_name || 'My Number'} (Self)
              </p>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1.5">{profile.phone}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0" />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col space-y-4 overflow-hidden w-full">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 shrink-0">Recent Transactions</h3>
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar pb-6 w-full">
          {(recentTransactions.length > 0 ? recentTransactions : [
            { id: 'm1', mobile_number: '8668075429', amount: 239 },
            { id: 'm2', mobile_number: '9876543210', amount: 299 },
            { id: 'm3', mobile_number: '9123456789', amount: 749 }
          ]).map((txn) => (
            <div
              key={txn.id}
              onClick={() => handleMobileChange(txn.mobile_number)}
              className="group flex items-center gap-5 p-5 bg-white border border-slate-100 rounded-[28px] hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer w-full active:scale-[0.99]"
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
              <p className="text-sm font-black text-emerald-600 select-all">{upiVpa}</p>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
              <PrePeSpinner className="h-3 w-3" />
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-tight">Waiting for payment...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}