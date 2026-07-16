import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getOperators } from '@/services/operator.service';
import type { Operator } from '@/types/recharge.types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchDTHCustomerDetails, fetchDTHPlans, DTHCustomerInfoResponse } from '@/services/kwikApiService';
import { Loader2, ArrowRight, ShieldCheck, Wallet, AlertCircle, Info, Sparkles, CheckCircle2, XCircle, Tv } from "lucide-react";
import { processRecharge } from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { upiService } from "@/services/upi";
import { QRCodeSVG } from "qrcode.react";
import { useKYC } from "@/hooks/useKYC";
import { KYCNudgeDialog } from "@/components/kyc/KYCNudgeDialog";
import { triggerAutonomousRechargeRewards } from "@/services/rewards.service";

export const DTHEnterDetails = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { availableBalance, refetch: refetchWallet } = useWallet();
    const { isApproved } = useKYC();
    const { toast } = useToast();

    const operatorId = searchParams.get('operator');
    const [operator, setOperator] = useState<Operator | null>(null);
    const [dthId, setDthId] = useState("");
    const [amount, setAmount] = useState("");
    const [registeredMobile, setRegisteredMobile] = useState("");

    // Step state
    const [step, setStep] = useState<'entry' | 'details'>('entry');
    const [verifiedId, setVerifiedId] = useState("");

    const [loading, setLoading] = useState(true);
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [customerInfo, setCustomerInfo] = useState<DTHCustomerInfoResponse['response']['info'][0] | null>(null);

    // Payment Flow State
    const [showConfirm, setShowConfirm] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Split Payment State
    const [upiState, setUpiState] = useState<{
        intentUrl: string;
        upiRef: string;
        qrData: string;
    } | null>(null);
    const [polling, setPolling] = useState(false);
    const [showKYCNudge, setShowKYCNudge] = useState(false);

    // DTH Plans State
    const [plansLoading, setPlansLoading] = useState(false);
    const [plansData, setPlansData] = useState<Record<string, any> | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("");

    useEffect(() => {
        const loadOp = async () => {
            const ops = await getOperators('dth');
            const found = ops.find(o => o.id === operatorId);
            if (found) setOperator(found);
            setLoading(false);
        };
        loadOp();
    }, [operatorId]);

    const fetchInfo = async (overrideId?: any) => {
        const idToQuery = (typeof overrideId === 'string' && overrideId) ? overrideId : dthId;
        if (!operator || !idToQuery || idToQuery.length < 6) return;
        setFetchingInfo(true);
        try {
            const result = await fetchDTHCustomerDetails(operator.id, idToQuery);
            if (result.status === 'SUCCESS' && result.response?.info?.length) {
                const info = result.response.info[0];
                setCustomerInfo(info);
                setVerifiedId(idToQuery);
                
                const lastAmt = info.lastrechargeamount ? info.lastrechargeamount.replace(/[^0-9.]/g, '') : '';
                const monthlyAmt = info.monthlyRecharge ? info.monthlyRecharge.replace(/[^0-9.]/g, '') : '';
                const targetAmt = monthlyAmt || lastAmt;
                
                if (targetAmt && parseFloat(targetAmt) > 0) {
                    setAmount(targetAmt);
                }

                // Prefetch plans inline
                try {
                    setPlansLoading(true);
                    const plansRes = await fetchDTHPlans(operator.id);
                    if (plansRes && plansRes.success && plansRes.plans && Object.keys(plansRes.plans).length > 0) {
                        setPlansData(plansRes.plans);
                        const categories = Object.keys(plansRes.plans);
                        if (categories.length > 0) setActiveCategory(categories[0]);
                    } else {
                        const mockPlans = getMockDTHPlans(operator.name);
                        setPlansData(mockPlans);
                        const categories = Object.keys(mockPlans);
                        if (categories.length > 0) setActiveCategory(categories[0]);
                    }
                } catch (pe) {
                    const mockPlans = getMockDTHPlans(operator.name);
                    setPlansData(mockPlans);
                    const categories = Object.keys(mockPlans);
                    if (categories.length > 0) setActiveCategory(categories[0]);
                } finally {
                    setPlansLoading(false);
                }

                setStep('details');
            } else {
                setCustomerInfo(null);
                toast({
                    title: "Verification Unavailable",
                    description: "Details could not be auto-verified, but you can enter details manually.",
                    variant: "default"
                });
                
                // Prefetch mock/fallback plans
                const mockPlans = getMockDTHPlans(operator.name);
                setPlansData(mockPlans);
                const categories = Object.keys(mockPlans);
                if (categories.length > 0) setActiveCategory(categories[0]);
                setStep('details');
            }
        } catch (error) {
            console.error("Error fetching DTH customer details:", error);
            setCustomerInfo(null);
            toast({
                title: "Verification Offline",
                description: "Account verification is offline. Please enter details manually.",
                variant: "default"
            });
            
            // Prefetch mock/fallback plans
            const mockPlans = getMockDTHPlans(operator.name);
            setPlansData(mockPlans);
            const categories = Object.keys(mockPlans);
            if (categories.length > 0) setActiveCategory(categories[0]);
            setStep('details');
        }
        setFetchingInfo(false);
    };

    const handleSelectPlan = (rs: number) => {
        setAmount(rs.toString());
    };

    const getExpectedLength = () => {
        if (!operator) return 0;
        const code = operator.code.toUpperCase();
        if (code.includes('AIRTEL')) return 10;
        if (code.includes('TATA')) return 10;
        if (code.includes('SUN')) return 11;
        if (code.includes('D2H') || code.includes('VIDEOCON')) return 10;
        if (code.includes('DISH')) return 10; // 10 or 11
        return 10;
    };

    // Auto verification when target length format is matched
    useEffect(() => {
        if (!operator || !dthId || fetchingInfo) return;
        const expected = getExpectedLength();
        const code = operator.code.toUpperCase();
        
        let isMatching = dthId.length === expected;
        if (code.includes('DISH')) {
            isMatching = dthId.length === 10 || dthId.length === 11;
        }

        if (isMatching && dthId !== verifiedId) {
            fetchInfo(dthId);
        }
    }, [dthId, operator]);

    useEffect(() => {
        if (operator && location.state?.dthId) {
            const prefilledId = location.state.dthId;
            setDthId(prefilledId);
            fetchInfo(prefilledId);
        }
    }, [operator, location.state]);

    const handleBack = () => {
        if (step === 'details') {
            setStep('entry');
            setVerifiedId('');
            setCustomerInfo(null);
            setAmount('');
        } else {
            navigate(-1);
        }
    };

    const handleConfirm = () => {
        if (!dthId) {
            toast({ title: "Required", description: "Please enter Subscriber ID", variant: "destructive" });
            return;
        }
        setShowConfirm(true);
    };

    const handleProceedToPay = async () => {
        if (!user || !operator) return;

        if (!isApproved) {
            setShowKYCNudge(true);
            return;
        }

        const rechargeAmount = parseFloat(amount || "0");

        // Split Payment Logic Check
        if (rechargeAmount > availableBalance) {
            initiateSplitPayment(rechargeAmount - availableBalance);
            return;
        }

        // Direct Wallet Payment
        setProcessing(true);
        const result = await processRecharge(user.id, {
            dth_id: dthId,
            operator_id: operator.id,
            amount: rechargeAmount,
            mobile_number: registeredMobile
        });

        setProcessing(false);
        setShowConfirm(false);

        if (result.status === 'SUCCESS' || result.status === 'PENDING') {
            try {
                const isFromFav = location.state?.fromFavorite || false;
                await triggerAutonomousRechargeRewards(user.id, rechargeAmount, isFromFav);
            } catch (rewErr) {
                console.error("Failed to credit autonomous recharge rewards:", rewErr);
            }
            toast({ title: 'Success', description: 'Recharge Successful!' });
            navigate('/recharge/receipt', { 
                state: { 
                    amount, 
                    operator: operator.name, 
                    number: dthId, 
                    refId: result.transaction_id || 'N/A',
                    type: 'DTH Recharge'
                } 
            });
        } else {
            toast({ title: 'Failed', description: result.message, variant: 'destructive' });
        }
    };

    const initiateSplitPayment = async (shortfallAmount: number) => {
        setProcessing(true);
        try {
            const res = await upiService.createPaymentIntent({
                amount: shortfallAmount,
                name: "Prepe Topup",
                note: `Topup for DTH ${dthId}`
            });
            setUpiState(res);
            startPolling(res.upiRef);
        } catch (e: any) {
            toast({ title: "Payment Error", description: e.message, variant: "destructive" });
            setProcessing(false);
        }
    };

    const startPolling = async (refId: string) => {
        setPolling(true);
        let attempts = 0;
        const maxAttempts = 60; // 3 minutes timeout

        const poll = async () => {
            if (attempts >= maxAttempts) {
                setPolling(false);
                setProcessing(false);
                toast({ title: "Timeout", description: "Payment status check timed out.", variant: "destructive" });
                return;
            }

            try {
                const status = await upiService.checkPaymentStatus(refId);
                if (status.status === 'SUCCESS') {
                    setPolling(false);
                    setUpiState(null);
                    await refetchWallet();
                    proceedWithRechargeAfterTopup();
                } else if (status.status === 'FAILED') {
                    setPolling(false);
                    setProcessing(false);
                    toast({ title: "Payment Failed", description: "UPI Transaction failed", variant: "destructive" });
                } else {
                    attempts++;
                    setTimeout(poll, 3000);
                }
            } catch (e) {
                console.error("Poll error", e);
                attempts++;
                setTimeout(poll, 3000);
            }
        };

        poll();
    };

    const proceedWithRechargeAfterTopup = async () => {
        setTimeout(async () => {
            const result = await processRecharge(user!.id, {
                dth_id: dthId,
                operator_id: operator!.id,
                amount: parseFloat(amount),
                mobile_number: registeredMobile
            });

            setProcessing(false);
            setShowConfirm(false);

            if (result.status === 'SUCCESS' || result.status === 'PENDING') {
                try {
                    const isFromFav = location.state?.fromFavorite || false;
                    await triggerAutonomousRechargeRewards(user!.id, parseFloat(amount), isFromFav);
                } catch (rewErr) {
                    console.error("Failed to credit autonomous recharge rewards:", rewErr);
                }
                toast({ title: 'Success', description: 'Recharge Successful!' });
                navigate('/recharge/receipt', { 
                    state: { 
                        amount, 
                        operator: operator!.name, 
                        number: dthId, 
                        refId: result.transaction_id || 'N/A',
                        type: 'DTH Recharge'
                    } 
                });
            } else {
                toast({ title: 'Failed', description: result.message, variant: 'destructive' });
            }
        }, 1500);
    };

    if (loading) {
        return (
            <Layout title="Enter Details" showBack>
                <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
                    <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
                    <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest animate-pulse">Syncing Gateway...</span>
                </div>
            </Layout>
        );
    }

    const rechargeAmountVal = parseFloat(amount || '0');
    const needsSplitPayment = rechargeAmountVal > availableBalance;
    const payFromWallet = needsSplitPayment ? availableBalance : rechargeAmountVal;
    const payFromUpi = needsSplitPayment ? rechargeAmountVal - availableBalance : 0;

    return (
        <Layout title={step === 'details' ? "Confirm & Pay" : "Enter Details"} showBack onBack={handleBack}>
            <div className="relative bg-[#f8fbfe] min-h-screen pb-24 overflow-hidden text-slate-850 font-sans select-none">
                {/* Decorative Premium Glow Background Blobs */}
                <div className="absolute top-[-10%] left-[-20%] w-[350px] h-[350px] bg-gradient-to-br from-indigo-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-gradient-to-br from-emerald-100/20 via-teal-50/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Bharat Connect Header */}
                <div className="absolute top-4 right-4 z-50 transition-all duration-300 hover:opacity-100 opacity-90">
                    <img
                        src="/bharat-connect.svg" 
                        alt="Bharat Connect"
                        className="h-7 w-auto object-contain drop-shadow-sm"
                    />
                </div>

                <div className="p-4 space-y-6 max-w-md mx-auto relative z-10 pt-6">
                    {/* Visual Intro Badge */}
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100/85 px-3.5 py-1.5 rounded-full text-xs font-black w-fit animate-pulse shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>BBPS SECURE DIRECT DTH RECHARGE</span>
                    </div>

                    {/* Step 1: Entry View */}
                    {step === 'entry' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Operator Card */}
                            {operator && (
                                <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-slate-100 flex items-center justify-between transition-all hover:border-indigo-200 hover:bg-white shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                                            <Avatar className="h-full w-full rounded-none">
                                                <AvatarImage src={operator.logo || ''} className="object-contain" />
                                                <AvatarFallback className="bg-indigo-50 text-indigo-600 text-xs font-black rounded-lg">{operator.name[0]}</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-extrabold text-slate-800 leading-tight">{operator.name}</span>
                                            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1">DTH Operator</span>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 h-8 px-3 rounded-xl text-xs font-black transition-all active:scale-95 border border-indigo-100/50" 
                                        onClick={() => navigate('/dth-recharge')}
                                    >
                                        Change
                                    </Button>
                                </div>
                            )}

                            {/* Subscriber ID input */}
                            <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                <Label className="text-xs text-slate-550 font-extrabold uppercase tracking-widest block mb-1">Enter Customer ID / Subscriber ID</Label>
                                <div className="relative group transition-all duration-300">
                                    <Tv className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 transition-transform group-focus-within:scale-110" />
                                    <Input
                                        placeholder="Customer ID / Subscriber ID"
                                        className="pl-12 pr-4 h-14 bg-white border-slate-200 rounded-2xl shadow-sm text-slate-900 focus-visible:border-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/10 transition-all text-base placeholder:text-slate-400 font-semibold"
                                        value={dthId}
                                        onChange={(e) => setDthId(e.target.value.replace(/\D/g, ''))}
                                    />
                                </div>

                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1">
                                    <span>MIN 6 DIGITS SUBSCRIBER ID</span>
                                    {fetchingInfo && (
                                        <span className="text-indigo-600 animate-pulse flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Auto-Verifying...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Details & Plans View */}
                    {step === 'details' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Unified Customer Ticket Details Card */}
                            <div className="bg-gradient-to-br from-white/95 via-indigo-50/40 to-white/95 border border-indigo-100 shadow-xl rounded-3xl p-5 relative overflow-hidden text-slate-800">
                                {/* Ticket Cut-Out Circles on left and right borders */}
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#f8fbfe] rounded-full border-r border-indigo-100 z-10" />
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#f8fbfe] rounded-full border-l border-indigo-100 z-10" />

                                <div className="flex justify-between items-center border-b border-indigo-100 border-dashed pb-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500 animate-pulse" />
                                        <span className="text-xs font-extrabold tracking-widest uppercase text-indigo-700">VERIFIED CUSTOMER TICKET</span>
                                    </div>
                                    <span className="text-[9px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded-full border border-emerald-200 tracking-widest uppercase flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                        {customerInfo?.status || "ACTIVE"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs font-semibold text-slate-500">
                                    <div className="col-span-2 border-b border-indigo-50 pb-2">
                                        <span className="text-[10px] uppercase tracking-wider block text-slate-400 mb-0.5">Subscriber Name</span>
                                        <span className="text-sm font-black text-slate-800 block truncate">{customerInfo?.customerName || "Manual DTH Recharge User"}</span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider block text-slate-400 mb-0.5">Subscriber ID</span>
                                        <span className="font-bold text-slate-800">{dthId}</span>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase tracking-wider block text-slate-400 mb-0.5">Registered Mobile</span>
                                        <span className="font-bold text-slate-800 truncate block">{user?.phone || "N/A"}</span>
                                    </div>

                                    {customerInfo?.balance && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider block text-slate-400 mb-0.5">Current DTH Balance</span>
                                            <span className="font-extrabold text-indigo-600">₹{customerInfo.balance}</span>
                                        </div>
                                    )}

                                    {customerInfo?.monthlyRecharge && (
                                        <div>
                                            <span className="text-[10px] uppercase tracking-wider block text-slate-400 mb-0.5">Monthly Recharge</span>
                                            <span className="font-extrabold text-emerald-600">₹{customerInfo.monthlyRecharge}</span>
                                        </div>
                                    )}

                                    {customerInfo?.lastrechargeamount && (
                                        <div className="col-span-2 border-t border-indigo-50 pt-2 flex justify-between items-center text-[11px]">
                                            <span className="text-slate-400">Last Recharge</span>
                                            <span className="font-bold text-slate-700 bg-slate-50 border border-slate-100 rounded-md px-2 py-0.5">
                                                ₹{customerInfo.lastrechargeamount} {customerInfo.lastrechargedate ? `on ${customerInfo.lastrechargedate}` : ''}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Operator Card showing Change option */}
                            {operator && (
                                <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-slate-100 flex items-center justify-between transition-all hover:border-indigo-200 hover:bg-white shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 p-1.5 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-center overflow-hidden">
                                            <img src={operator.logo || ''} alt={operator.name} className="h-full w-full object-contain" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-xs leading-tight">{operator.name}</span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Subscriber ID: {dthId}</span>
                                        </div>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        className="text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 h-8 px-2.5 rounded-lg text-xs font-black transition-all active:scale-95" 
                                        onClick={handleBack}
                                    >
                                        Edit ID
                                    </Button>
                                </div>
                            )}

                            {/* Amount Input Card */}
                            <div className="bg-white/85 backdrop-blur-md p-5 rounded-3xl border border-slate-100 group focus-within:border-indigo-200 transition-all shadow-sm">
                                <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest">Recharge Amount</span>
                                    <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 font-black px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
                                        <Wallet className="h-3 w-3" /> BAL: ₹{availableBalance.toFixed(2)}
                                    </span>
                                </div>
                                <div className="relative flex items-center">
                                    <span className="absolute left-1 text-3xl font-black text-slate-900">₹</span>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        className="pl-7 pr-4 h-16 bg-transparent border-none text-3xl font-black text-slate-900 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-300"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                    />
                                </div>

                                {/* Suggestion pills */}
                                <div className="flex gap-2.5 mt-4 overflow-x-auto no-scrollbar py-1">
                                    {['150', '250', '500', '1000'].map(pill => (
                                        <Button
                                            key={pill}
                                            variant="outline"
                                            className={`rounded-xl px-4 py-1.5 h-auto text-xs font-bold border-slate-100 hover:bg-indigo-50/50 hover:text-indigo-600 hover:border-indigo-200 active:scale-95 transition-all ${amount === pill ? 'bg-indigo-50 border-indigo-300 text-indigo-600 font-extrabold' : 'bg-white text-slate-600'}`}
                                            onClick={() => setAmount(pill)}
                                        >
                                            ₹{pill}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Inline DTH Plans List */}
                            {plansLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 space-y-3 bg-white/70 rounded-3xl p-5 border border-slate-100 shadow-sm">
                                    <Loader2 className="animate-spin text-indigo-600 h-8 w-8" />
                                    <span className="text-xs text-slate-500 font-bold tracking-widest uppercase animate-pulse">Fetching Operator Plans...</span>
                                </div>
                            ) : plansData && Object.keys(plansData).length > 0 ? (
                                <div className="bg-white/80 backdrop-blur-md p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 px-1">
                                        <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                                        <h3 className="font-extrabold text-xs tracking-tight text-slate-900 uppercase">Available Plans & Combo Packs</h3>
                                    </div>
                                    
                                    <Tabs value={activeCategory} onValueChange={setActiveCategory} className="space-y-4">
                                        <TabsList className="bg-slate-50 p-1 rounded-2xl border border-slate-100 overflow-x-auto justify-start no-scrollbar flex flex-row w-full">
                                            {Object.keys(plansData).map((category) => (
                                                <TabsTrigger 
                                                    key={category} 
                                                    value={category}
                                                    className="rounded-xl px-4 py-2 text-xs font-black tracking-wider transition-all data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-100 shrink-0"
                                                >
                                                    {category}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>

                                        <div className="max-h-[350px] overflow-y-auto pr-1 no-scrollbar space-y-3">
                                            {Object.keys(plansData).map((category) => (
                                                <TabsContent key={category} value={category} className="space-y-3 mt-0 focus-visible:outline-none">
                                                    {plansData[category].map((plan: any, idx: number) => (
                                                        <div 
                                                            key={`${category}-plan-${idx}`}
                                                            onClick={() => handleSelectPlan(plan.rs)}
                                                            className="bg-slate-50/50 hover:bg-indigo-50/20 border border-slate-100 hover:border-indigo-200 rounded-3xl p-4 transition-all active:scale-[0.99] cursor-pointer group flex justify-between items-start gap-4"
                                                        >
                                                            <div className="space-y-1.5 flex-1 min-w-0 text-left">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[9px] bg-indigo-50/80 text-indigo-700 font-black px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase tracking-widest">
                                                                        {plan.Type || 'Plan'}
                                                                    </span>
                                                                    {plan.validity && (
                                                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                                                            {plan.validity}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs font-semibold text-slate-650 leading-relaxed group-hover:text-slate-800 transition-colors">
                                                                    {plan.desc}
                                                                </p>
                                                            </div>
                                                            <div className="text-right shrink-0">
                                                                <div className="text-lg font-black text-indigo-600">₹{plan.rs}</div>
                                                                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md uppercase tracking-wider mt-1 block">
                                                                    SELECT
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </TabsContent>
                                            ))}
                                        </div>
                                    </Tabs>
                                </div>
                            ) : null}

                            {/* Proceed Button */}
                            <Button 
                                className={`w-full h-14 text-base font-extrabold shadow-md rounded-2xl transition-all duration-300 active:scale-[0.98] ${
                                    amount && dthId 
                                        ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-indigo-500/20' 
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                                }`}
                                onClick={handleConfirm} 
                                disabled={!amount || !dthId}
                            >
                                Confirm & Proceed
                            </Button>

                            {/* Security BBPS Info */}
                            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 border border-slate-100 flex gap-3 text-xs leading-relaxed text-slate-500">
                                <AlertCircle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <span className="font-extrabold text-slate-800 block mb-0.5">BBPS Secure Pay Protection</span>
                                    Please verify the Customer ID and plan amount before proceeding. Recharges cannot be rolled back after completion under operator guidelines.
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Confirmation Dialog / Bottom Sheet Style */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="max-w-md rounded-3xl p-0 overflow-hidden bg-white border border-slate-150 shadow-2xl text-slate-800">
                    <div className="p-0">
                        {/* Header Info */}
                        <div className="bg-slate-50 p-4 flex items-center justify-between border-b border-slate-150">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 p-1.5 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                                    <img src={operator?.logo || ''} alt={operator?.name} className="h-full w-full object-contain" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-extrabold text-slate-850 leading-tight truncate max-w-[180px]">{dthId}</span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{operator?.name}</span>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2.5 rounded-lg text-xs font-black text-indigo-600 hover:text-indigo-700 hover:bg-slate-100 transition-colors" 
                                onClick={() => setShowConfirm(false)}
                            >
                                Edit Details
                            </Button>
                        </div>

                        {/* Content Area */}
                        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                            {/* Plan Details Card */}
                            <div className="bg-slate-50 rounded-3xl p-5 shadow-inner border border-slate-100 text-center space-y-4">
                                <div>
                                    <div className="text-3xl font-black text-slate-900">₹{amount}</div>
                                    <button 
                                        type="button"
                                        className="text-xs font-black text-indigo-600 hover:text-indigo-700 mt-1.5 cursor-pointer" 
                                        onClick={() => setShowConfirm(false)}
                                    >
                                        Change Amount
                                    </button>
                                </div>

                                <div className="space-y-2.5 pt-2 text-left text-xs font-semibold">
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="text-slate-500">Customer Name</span>
                                        <span className="font-bold text-slate-800">{customerInfo?.customerName || 'N/A'}</span>
                                    </div>

                                    {customerInfo?.planname && (
                                        <div className="flex justify-between border-b border-slate-100 pb-2">
                                            <span className="text-slate-500">Current Plan</span>
                                            <span className="font-bold text-slate-800 text-right max-w-[60%] truncate">{customerInfo.planname}</span>
                                        </div>
                                    )}

                                    <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-indigo-50/30 rounded-xl p-3 text-[11px] text-slate-600 leading-normal flex items-start gap-2 border border-indigo-100/50">
                                        <Sparkles className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5 animate-pulse" />
                                        <div>
                                            <span className="font-extrabold text-indigo-700 block mb-0.5">Payment Benefits</span>
                                            {customerInfo?.planname
                                                ? `Extends your active DTH subscription: ${customerInfo.planname}.`
                                                : "Top-up balance credit. Immediate validation for plan activation."}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Breakdown Card */}
                            {upiState ? (
                                <div className="bg-slate-50 rounded-3xl p-5 shadow-inner border border-slate-100 text-center space-y-4">
                                    <div className="flex items-center justify-center gap-2 text-indigo-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <h3 className="font-extrabold text-sm tracking-wide uppercase">Split Pay UPI Active</h3>
                                    </div>
                                    <div className="bg-white p-3.5 rounded-3xl border border-slate-200 inline-block shadow-sm">
                                        <QRCodeSVG value={upiState.qrData} size={150} />
                                    </div>
                                    <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                                        Scan this secure dynamic QR using BHIM, GPay, PhonePe, or Paytm to complete balance shortfall of <span className="font-extrabold text-slate-800">₹{payFromUpi.toFixed(2)}</span>
                                    </p>
                                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 text-xs font-black rounded-xl shadow-md shadow-indigo-600/15">
                                        <a href={upiState.intentUrl}>Launch UPI Payment App</a>
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-3xl p-5 shadow-inner border border-slate-100 space-y-3 text-xs font-semibold">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">Total Recharge</span>
                                        <span className="font-bold text-slate-800">₹{parseFloat(amount || '0').toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500">PrePe Wallet balance</span>
                                        <span className="font-bold text-slate-800">₹{availableBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-slate-200 my-1"></div>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-600">UPI Shortfall payable</span>
                                        <span className="text-indigo-600 text-base font-black">
                                            ₹{(needsSplitPayment ? payFromUpi : 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {!needsSplitPayment ? (
                                        <div className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1.5 mt-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Fully covered by Wallet Balance
                                        </div>
                                    ) : (
                                        <div className="text-[10px] text-amber-600 font-bold flex items-center justify-end gap-1.5 mt-1">
                                            <Wallet className="h-3.5 w-3.5 text-amber-500 animate-bounce" /> Wallet pays ₹{payFromWallet.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="pt-2">
                                <Button
                                    className={`w-full h-13 text-sm font-extrabold text-white rounded-2xl shadow-lg transition-all active:scale-[0.98] ${
                                        processing || !!upiState
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                                            : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-indigo-500/10'
                                    }`}
                                    onClick={handleProceedToPay}
                                    disabled={processing || !!upiState}
                                >
                                    {processing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                                    {upiState ? 'Awaiting payment confirmation...' : 'Confirm & Proceed to Pay'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <KYCNudgeDialog
                isOpen={showKYCNudge}
                onClose={() => setShowKYCNudge(false)}
                featureName="DTH Recharge"
            />
        </Layout>
    );
};

// High-fidelity DTH Plans Database matching Indian Telecom Packs
const getMockDTHPlans = (operatorName: string): Record<string, { rs: number; validity: string; desc: string; Type: string }[]> => {
    const name = operatorName.toLowerCase();
    
    if (name.includes('airtel')) {
        return {
            "Popular Packs": [
                { rs: 280, validity: "1 Month", desc: "Airtel DTH Value Pack - 240+ SD Channels including all major regional languages.", Type: "Value Pack" },
                { rs: 350, validity: "1 Month", desc: "Airtel DTH Value Lite Pack - 280+ SD Channels + 10 HD Channels.", Type: "HD Value" },
                { rs: 450, validity: "1 Month", desc: "Airtel DTH Premium HD Pack - 320+ Channels including 35 HD Channels.", Type: "Premium HD" }
            ],
            "Long Term Packs": [
                { rs: 799, validity: "3 Months", desc: "Airtel DTH Value Pack - 3 Months Subscription. Saving ₹41.", Type: "3 Months Saver" },
                { rs: 1550, validity: "6 Months", desc: "Airtel DTH Value Pack - 6 Months Subscription. Saving ₹130.", Type: "6 Months Saver" },
                { rs: 2999, validity: "12 Months", desc: "Airtel DTH Value Pack - Annual Pack. Saving ₹361.", Type: "Annual Pack" }
            ],
            "HD Special": [
                { rs: 480, validity: "1 Month", desc: "Airtel DTH HD Sports Pack - 300+ Channels with all major sports HD channels.", Type: "Sports HD" },
                { rs: 599, validity: "1 Month", desc: "Airtel DTH Ultra HD Family - 350+ Channels with 50+ HD channels.", Type: "Ultra HD" }
            ]
        };
    }
    
    if (name.includes('tata')) {
        return {
            "Popular Packs": [
                { rs: 268, validity: "1 Month", desc: "Tata Play Dhamaal Mix - 220+ Channels with major entertainment and news.", Type: "Entertainment" },
                { rs: 329, validity: "1 Month", desc: "Tata Play Royale All Sports - 96 SD Channels with all major sports channels.", Type: "Sports Pack" },
                { rs: 378, validity: "1 Month", desc: "Tata Play Royale World - 112 SD Channels with international news & movies.", Type: "Premium Pack" }
            ],
            "Long Term Packs": [
                { rs: 750, validity: "3 Months", desc: "Tata Play Dhamaal Mix - 3 Months. Save ₹54.", Type: "3 Months Saver" },
                { rs: 1450, validity: "6 Months", desc: "Tata Play Dhamaal Mix - 6 Months. Save ₹158.", Type: "6 Months Saver" },
                { rs: 2800, validity: "12 Months", desc: "Tata Play Dhamaal Mix - Annual Pack. Save ₹416.", Type: "Annual Pack" }
            ],
            "HD Special": [
                { rs: 371, validity: "1 Month", desc: "Tata Play Royale Sports Kids HD - 81 Channels with 29 HD channels.", Type: "Kids & Sports HD" },
                { rs: 443, validity: "1 Month", desc: "Tata Play Royale All Sports HD - 99 Channels with 40 HD channels.", Type: "Sports HD" },
                { rs: 519, validity: "1 Month", desc: "Tata Play Royale World HD - 118 Channels with 49 HD channels.", Type: "Royale HD" }
            ]
        };
    }
    
    if (name.includes('dish')) {
        return {
            "Popular Packs": [
                { rs: 199, validity: "1 Month", desc: "Dish TV Delight HSM - 26 SD Channels with all major Hindi entertainment.", Type: "Delight Pack" },
                { rs: 249, validity: "1 Month", desc: "Dish TV Swagat Pack - 200+ SD Channels with news & regional channels.", Type: "Swagat Pack" },
                { rs: 310, validity: "1 Month", desc: "Dish TV Super Family Pack - 260+ SD Channels.", Type: "Family Pack" }
            ],
            "Long Term Packs": [
                { rs: 580, validity: "3 Months", desc: "Dish TV Delight HSM - 3 Months. Save ₹17.", Type: "3 Months Saver" },
                { rs: 1100, validity: "6 Months", desc: "Dish TV Delight HSM - 6 Months. Save ₹94.", Type: "6 Months Saver" },
                { rs: 2150, validity: "12 Months", desc: "Dish TV Delight HSM - Annual Pack. Save ₹238.", Type: "Annual Pack" }
            ],
            "HD Special": [
                { rs: 300, validity: "1 Month", desc: "Dish TV Delight HD - 36 Channels with 10 HD channels.", Type: "Delight HD" },
                { rs: 369, validity: "1 Month", desc: "Dish TV Family HD - 44 Channels with 14 HD channels.", Type: "Family HD" },
                { rs: 510, validity: "1 Month", desc: "Dish TV Royale HD - 81 Channels with 29 HD channels.", Type: "Royale HD" }
            ]
        };
    }
    
    if (name.includes('sun')) {
        return {
            "Popular Packs": [
                { rs: 220, validity: "1 Month", desc: "Sun Direct Joyful Pack - 180+ Channels with complete regional packs.", Type: "Joyful Pack" },
                { rs: 275, validity: "1 Month", desc: "Sun Direct Tamil Gold - 220+ Channels with all Tamil language channels.", Type: "Tamil Gold" },
                { rs: 320, validity: "1 Month", desc: "Sun Direct Tamil Cinema + Sports - 240+ Channels.", Type: "Cinema & Sports" }
            ],
            "Long Term Packs": [
                { rs: 620, validity: "3 Months", desc: "Sun Direct Tamil Gold - 3 Months. Save ₹205.", Type: "3 Months Saver" },
                { rs: 1200, validity: "6 Months", desc: "Sun Direct Tamil Gold - 6 Months. Save ₹450.", Type: "6 Months Saver" },
                { rs: 2300, validity: "12 Months", desc: "Sun Direct Tamil Gold - Annual Pack. Save ₹1000.", Type: "Annual Pack" }
            ],
            "HD Special": [
                { rs: 340, validity: "1 Month", desc: "Sun Direct Tamil Gold HD - 200+ Channels with 25+ HD channels.", Type: "Tamil HD" },
                { rs: 425, validity: "1 Month", desc: "Sun Direct Tamil Diamond HD - 250+ Channels with 45+ HD channels.", Type: "Diamond HD" }
            ]
        };
    }
    
    // Default/Videocon D2H
    return {
        "Popular Packs": [
            { rs: 230, validity: "1 Month", desc: "D2h Value Combo - 210+ Channels with basic entertainment.", Type: "Value Pack" },
            { rs: 290, validity: "1 Month", desc: "D2h Diamond Pack - 260+ Channels including all major regional languages.", Type: "Diamond Pack" },
            { rs: 350, validity: "1 Month", desc: "D2h Gold HD Pack - 240+ Channels + 15 HD Channels.", Type: "HD Gold" }
        ],
        "Long Term Packs": [
            { rs: 650, validity: "3 Months", desc: "D2h Value Combo - 3 Months. Save ₹40.", Type: "3 Months Saver" },
            { rs: 1250, validity: "6 Months", desc: "D2h Value Combo - 6 Months. Save ₹130.", Type: "6 Months Saver" },
            { rs: 2400, validity: "12 Months", desc: "D2h Value Combo - Annual Pack. Save ₹360.", Type: "Annual Pack" }
        ],
        "HD Special": [
            { rs: 390, validity: "1 Month", desc: "D2h Diamond HD Pack - 280+ Channels with 30 HD channels.", Type: "Diamond HD" },
            { rs: 499, validity: "1 Month", desc: "D2h Platinum HD Pack - 320+ Channels with 50 HD channels.", Type: "Platinum HD" }
        ]
    };
};
