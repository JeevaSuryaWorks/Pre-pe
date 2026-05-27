import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { getOperators } from '@/services/operator.service';
import type { Operator } from '@/types/recharge.types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchDTHCustomerDetails, DTHCustomerInfoResponse } from '@/services/kwikApiService';
import { Loader2, ArrowRight, ShieldCheck, Wallet, AlertCircle, Info, Sparkles, CheckCircle2, XCircle } from "lucide-react";
import { processRecharge } from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
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

    useEffect(() => {
        const loadOp = async () => {
            const ops = await getOperators('dth');
            const found = ops.find(o => o.id === operatorId);
            if (found) setOperator(found);
            setLoading(false);
        };
        loadOp();
    }, [operatorId]);

    const fetchInfo = async (overrideId?: string) => {
        const idToQuery = overrideId || dthId;
        if (!operator || idToQuery.length < 6) return;
        setFetchingInfo(true);
        try {
            const result = await fetchDTHCustomerDetails(operator.id, idToQuery);
            if (result.status === 'SUCCESS' && result.response?.info?.length) {
                setCustomerInfo(result.response.info[0]);
                if (result.response.info[0].monthlyRecharge) {
                    setAmount(result.response.info[0].monthlyRecharge.replace(/[^0-9.]/g, ''));
                }
            }
        } catch (error) {
            console.error("Error fetching DTH customer details:", error);
        }
        setFetchingInfo(false);
    };

    useEffect(() => {
        if (operator && location.state?.dthId) {
            const prefilledId = location.state.dthId;
            setDthId(prefilledId);
            fetchInfo(prefilledId);
        }
    }, [operator, location.state]);

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
            initiateSplitPayment(rechargeAmount);
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
                    refId: (result as any).referenceId || 'N/A',
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
                        refId: (result as any).referenceId || 'N/A',
                        type: 'DTH Recharge'
                    } 
                });
            } else {
                toast({ title: 'Recharge Failed', description: result.message, variant: 'destructive' });
            }
        }, 1500);
    };

    if (loading) return <div className="p-8 flex justify-center items-center h-64"><Loader2 className="animate-spin text-indigo-600 h-8 w-8" /></div>;

    const needsSplitPayment = parseFloat(amount || "0") > availableBalance;
    const payFromWallet = needsSplitPayment ? availableBalance : parseFloat(amount || "0");
    const payFromUpi = needsSplitPayment ? (parseFloat(amount || "0") - availableBalance) : 0;

    return (
        <Layout title="Enter Details" showBack>
            <div className="relative bg-[#f8fbfe] min-h-screen pb-24 overflow-hidden text-slate-850 font-sans select-none">
                {/* Decorative Premium Glow Background Blobs */}
                <div className="absolute top-[-10%] left-[-20%] w-[300px] h-[300px] bg-gradient-to-br from-indigo-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[20%] right-[-10%] w-[250px] h-[250px] bg-gradient-to-br from-emerald-100/20 via-teal-50/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Bharat Connect Logo */}
                <div className="absolute top-4 right-4 opacity-90 transition-all duration-300 hover:opacity-100 z-50">
                    <img 
                        src="/bharat-connect.svg" 
                        alt="Bharat Connect"
                        className="h-7 w-auto object-contain drop-shadow-sm" 
                    />
                </div>

                <div className="p-4 space-y-6 max-w-md mx-auto relative z-10 pt-6">
                    {/* Visual Intro Badge */}
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100/80 px-3.5 py-1.5 rounded-full text-xs font-black w-fit animate-pulse shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>BBPS SECURE DIRECT TRANSACTION ENTRY</span>
                    </div>

                    {/* Operator Header Card */}
                    {operator && (
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2.5xl border border-slate-100 flex items-center justify-between transition-all hover:border-indigo-200 hover:bg-white shadow-sm">
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
                                onClick={() => navigate(-1)}
                            >
                                Change
                            </Button>
                        </div>
                    )}

                    {/* Subscriber ID input */}
                    <div className="space-y-2">
                        <div className="relative group transition-all duration-300">
                            <Input
                                placeholder="Customer ID / Subscriber ID"
                                className="h-14 text-base bg-white/90 border-slate-200 rounded-2xl shadow-sm text-slate-900 group-focus-within:border-indigo-500 group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 transition-all placeholder:text-slate-400 font-semibold pl-4"
                                value={dthId}
                                onChange={(e) => setDthId(e.target.value)}
                                onBlur={fetchInfo}
                            />
                            {fetchingInfo && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                </div>
                            )}
                        </div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                <Info className="h-3.5 w-3.5 text-slate-400" /> Min 6 digits subscriber ID
                            </span>
                            {!fetchingInfo && dthId.length >= 6 && (
                                <button 
                                    onClick={fetchInfo} 
                                    className="text-[10px] text-indigo-600 hover:text-indigo-750 font-black uppercase transition-colors"
                                >
                                    Verify Account
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Customer Info Card if fetched */}
                    {customerInfo && (
                        <div className="bg-gradient-to-br from-white/95 via-indigo-50/40 to-white/95 border border-indigo-100 shadow-xl rounded-2.5xl p-5 relative overflow-hidden animate-fade-in shadow-indigo-500/5 group text-slate-800">
                            {/* Ticket Cut-Out Circles on left and right borders */}
                            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#f8fbfe] rounded-full border-r border-indigo-100 z-10" />
                            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#f8fbfe] rounded-full border-l border-indigo-100 z-10" />
                            <div className="absolute top-[-20%] right-[-10%] w-[120px] h-[120px] bg-indigo-100/20 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-100/40 transition-all duration-500" />
                            
                            <div className="flex justify-between items-center border-b border-indigo-100 border-dashed pb-3 mb-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500 animate-pulse" />
                                    <span className="text-xs font-extrabold tracking-widest uppercase text-indigo-705">VERIFIED CUSTOMER TICKET</span>
                                </div>
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-black px-2 py-0.5 rounded-full border border-emerald-200 tracking-widest">LIVE</span>
                            </div>
                            
                            <div className="space-y-3 text-xs font-semibold">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Subscriber Name</span>
                                    <span className="font-extrabold text-slate-800 text-sm">{customerInfo.customerName || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-500 uppercase tracking-wider text-[10px]">Available Balance</span>
                                    <span className="font-extrabold text-emerald-600 text-sm">₹{customerInfo.balance || '0.00'}</span>
                                </div>
                                {customerInfo.planname && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">Active Package</span>
                                        <span className="font-extrabold text-indigo-600 truncate max-w-[60%] text-right">{customerInfo.planname}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Amount Input */}
                    <div className="bg-white/85 backdrop-blur-md p-5 rounded-2.5xl border border-slate-100 group focus-within:border-indigo-200 transition-all shadow-sm">
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest">Recharge Amount</span>
                            <span className="text-[10px] bg-indigo-50 text-indigo-650 border border-indigo-100 font-black px-2 py-0.5 rounded-full flex items-center gap-1.5">
                                <Wallet className="h-3 w-3" /> BAL: ₹{availableBalance.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <span className="text-3xl font-black text-indigo-500 mr-2 select-none">₹</span>
                            <Input
                                className="border-0 shadow-none text-3xl font-black p-0 h-auto focus-visible:ring-0 placeholder:text-slate-300 bg-transparent text-slate-800 w-full"
                                placeholder="0"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                            />
                        </div>
                        
                        {/* Amount Suggestion Pills */}
                        <div className="flex gap-2 mt-4 pt-1 overflow-x-auto no-scrollbar">
                            {['150', '250', '500', '1000'].map((val) => (
                                <button
                                    key={`suggest-${val}`}
                                    type="button"
                                    onClick={() => setAmount(val)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black tracking-wider border transition-all active:scale-95 flex-shrink-0 ${
                                        amount === val 
                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-700 hover:border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    ₹{val}
                                </button>
                            ))}
                        </div>
                    </div>

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
                    <div className="bg-white/90 backdrop-blur-md rounded-2.5xl p-4 border border-slate-100 flex gap-3 text-xs leading-relaxed text-slate-500">
                        <AlertCircle className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <span className="font-extrabold text-slate-800 block mb-0.5">BBPS Secure Pay Protection</span>
                            Please verify the Customer ID and plan amount before proceeding. Recharges cannot be rolled back after completion under KwikApi guidelines.
                        </div>
                    </div>
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
                                    <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">{operator?.name}</span>
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
                            <div className="bg-slate-50 rounded-2.5xl p-5 shadow-inner border border-slate-100 text-center space-y-4">
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

                                    <div className="bg-gradient-to-r from-indigo-50/70 via-purple-50/50 to-indigo-50/30 rounded-xl p-3 text-[11px] text-slate-650 leading-normal flex items-start gap-2 border border-indigo-100/50">
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
                                <div className="bg-slate-50 rounded-2.5xl p-5 shadow-inner border border-slate-100 text-center space-y-4">
                                    <div className="flex items-center justify-center gap-2 text-indigo-600">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <h3 className="font-extrabold text-sm tracking-wide uppercase">Split Pay UPI Active</h3>
                                    </div>
                                    <div className="bg-white p-3.5 rounded-2.5xl border border-slate-200 inline-block shadow-sm">
                                        <QRCodeSVG value={upiState.qrData} size={150} />
                                    </div>
                                    <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                                        Scan this secure dynamic QR using BHIM, GPay, PhonePe, or Paytm to complete balance shortfall of <span className="font-extrabold text-slate-800">₹{payFromUpi.toFixed(2)}</span>
                                    </p>
                                    <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-500 text-white h-11 text-xs font-black rounded-xl shadow-md shadow-indigo-650/15">
                                        <a href={upiState.intentUrl}>Launch UPI Payment App</a>
                                    </Button>
                                </div>
                            ) : (
                                <div className="bg-slate-50 rounded-2.5xl p-5 shadow-inner border border-slate-100 space-y-3 text-xs font-semibold">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-550">Total Recharge</span>
                                        <span className="font-bold text-slate-805">₹{parseFloat(amount || '0').toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-550">PrePe Wallet balance</span>
                                        <span className="font-bold text-slate-805">₹{availableBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-slate-200 my-1"></div>
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-slate-600">UPI Shortfall payable</span>
                                        <span className="text-indigo-650 text-base font-black">
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
                        </div>

                        {/* Fixed Footer Button */}
                        <div className="p-4 bg-slate-50 border-t border-slate-150">
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
