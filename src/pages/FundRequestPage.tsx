import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
    Loader2, AlertCircle, ShieldCheck, Wallet as WalletIcon, 
    Plus, CreditCard, Zap, Lock, ArrowRight,
    Trophy, Landmark, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/layout/Layout";
import { useKYC } from "@/hooks/useKYC";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useWallet } from "@/hooks/useWallet";
import { backendWalletService } from "@/services/backendWallet.service";
import { manualFundService } from "@/services/manualFund.service";
import { creditWallet } from "@/services/wallet.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const FundRequestPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { isApproved, isLoading: kycLoading } = useKYC();
    const { availableBalance, refetch: refetchWallet } = useWallet();
    const { limits, planId } = usePlanLimits();

    const [activeTab, setActiveTab] = useState<"cash" | "credit">("cash");
    const [amount, setAmount] = useState(location.state?.amount?.toString() || "");
    const [loading, setLoading] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    const [transactionId, setTransactionId] = useState("");

    const baseAmount = Number(amount) || 0;
    const isBasic = planId.toUpperCase() === "BASIC";
    const hasBNPL = limits.features.bnpl;

    // Razorpay script loader
    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleInitiatePayment = async () => {
        if (!user || !isApproved) {
            toast.error("KYC Approval Required for adding funds.");
            return;
        }

        if (baseAmount < 1) {
            toast.error("Enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            const orderData = await backendWalletService.createOrder(baseAmount);
            const res = await loadRazorpay();

            if (!res) {
                toast.error('Razorpay SDK failed to load.');
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_YOUR_KEY_HERE",
                amount: orderData.amount,
                currency: orderData.currency,
                name: "PrePe Executive Wallet",
                description: `Topup: ₹${baseAmount}`,
                image: "/icon.png",
                order_id: orderData.id,
                handler: async function (response: any) {
                    try {
                        const verification = await backendWalletService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: baseAmount
                        });

                        if (verification) {
                            toast.success(`Wallet credited with ₹${baseAmount}.`);
                            refetchWallet();
                            navigate('/home');
                        }
                    } catch (error: any) {
                        toast.error(error.message || "Payment verification failed");
                    }
                },
                prefill: {
                    name: user?.user_metadata?.full_name || "User",
                    email: user?.email,
                    contact: user?.phone || ""
                },
                theme: { color: "#065f46" }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (e: any) {
            console.error(e);
            toast.error(e.message || "Integration error. Use QR fallback.");
            setIsFallback(true);
        } finally {
            setLoading(false);
        }
    };

    const handleBNPLRequest = async () => {
        if (!user || !isApproved) return;
        
        if (baseAmount < 1 || baseAmount > limits.bnplLimit) {
            toast.error(`Invalid amount. Max credit: ₹${limits.bnplLimit}`);
            return;
        }

        setLoading(true);
        try {
            // Simulated BNPL Approval
            const success = await creditWallet(
                user.id,
                baseAmount,
                `BNPL Instant Credit Line - Repay in ${limits.bnplCycleDays} days`
            );

            if (success) {
                toast.success(`Instant Credit Approved! ₹${baseAmount} added to wallet.`);
                refetchWallet();
                navigate('/home');
            } else {
                toast.error("Credit line currently unavailable. Try again later.");
            }
        } catch (err) {
            toast.error("Failed to process credit request.");
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!user || !transactionId || !baseAmount) return;
        setLoading(true);
        try {
            await manualFundService.submitRequest(user.id, baseAmount, transactionId);
            toast.success("Fund request submitted for verification.");
            navigate('/home');
        } catch (error: any) {
            toast.error("Submission failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout showBottomNav={true}>
            <div className="min-h-screen bg-[#F8FAFC] pb-32">
                {/* Header Background */}
                <div className="h-64 bg-emerald-900 rounded-b-[40px] absolute top-0 left-0 w-full z-0" />
                
                <div className="relative z-10 container max-w-md mx-auto pt-12 px-6">
                    <div className="flex flex-col items-center text-center mb-10 text-white">
                        <div className="bg-white/10 p-3 rounded-3xl backdrop-blur-md mb-4 border border-white/20">
                            <WalletIcon className="w-8 h-8 text-emerald-300" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">Fund Request</h1>
                        <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-[0.3em]">Executive Dash</p>
                    </div>

                    {/* --- Dual Tab Switcher --- */}
                    <div className="bg-emerald-800/50 backdrop-blur-md p-1.5 rounded-[28px] border border-white/10 flex gap-1 mb-8 shadow-2xl relative">
                        <div className="absolute inset-0 bg-black/10 rounded-[28px] pointer-events-none" />
                        <button 
                            onClick={() => setActiveTab("cash")}
                            className={cn(
                                "flex-1 py-4 px-4 rounded-[22px] flex flex-col items-center gap-1 transition-all relative z-10",
                                activeTab === "cash" ? "bg-white text-emerald-900 shadow-xl scale-[1.02]" : "text-white/70 hover:text-white"
                            )}
                        >
                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">Add Cash</span>
                            <span className="text-[9px] font-bold opacity-60">UPI / QR</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab("credit")}
                            className={cn(
                                "flex-1 py-4 px-4 rounded-[22px] flex flex-col items-center gap-1 transition-all relative z-10",
                                activeTab === "credit" ? "bg-white text-emerald-900 shadow-xl scale-[1.02]" : "text-white/70 hover:text-white"
                            )}
                        >
                            <span className="text-[11px] font-black uppercase tracking-widest leading-none">Instant Credit</span>
                            <span className="text-[9px] font-bold opacity-60">BNPL</span>
                            {isBasic && <Lock className="absolute top-2 right-2 w-3 h-3 text-amber-400 opacity-60" />}
                        </button>
                    </div>

                    {/* --- Content Area --- */}
                    <AnimatePresence mode="wait">
                        {activeTab === "cash" ? (
                            <motion.div 
                                key="cash"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden">
                                    <CardContent className="p-8 pt-10">
                                        {isFallback ? (
                                            <div className="space-y-8 flex flex-col items-center">
                                                <div className="bg-slate-50 p-6 rounded-[40px] border-2 border-dashed border-slate-200">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=jeevasuriya2007-1@okicici&pn=PrePe&am=${baseAmount}&cu=INR`)}`}
                                                        alt="UPI QR Code"
                                                        className="w-48 h-48 opacity-80"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">UPI ID</p>
                                                    <p className="text-sm font-black text-slate-800">jeevasuriya2007-1@okicici</p>
                                                </div>
                                                <div className="w-full space-y-4">
                                                    <Input
                                                        placeholder="Transaction ID (UTR)"
                                                        value={transactionId}
                                                        onChange={(e) => setTransactionId(e.target.value)}
                                                        className="h-16 rounded-2xl bg-slate-50 border-slate-100 font-bold px-6"
                                                    />
                                                    <Button 
                                                        className="w-full h-16 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-200 active:scale-95"
                                                        onClick={handleManualSubmit}
                                                        disabled={loading || !transactionId}
                                                    >
                                                        {loading ? <Loader2 className="animate-spin" /> : "Submit Request"}
                                                    </Button>
                                                    <button 
                                                        className="w-full text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-emerald-700 transition-colors"
                                                        onClick={() => setIsFallback(false)}
                                                    >
                                                        Retry Online Gateway
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-8">
                                                <div className="relative group">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₹</span>
                                                    <Input
                                                        type="number"
                                                        className="px-12 text-4xl font-black h-24 bg-slate-50 border-none rounded-[28px] focus:ring-4 focus:ring-emerald-50 tabular-nums"
                                                        placeholder="0"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    {[500, 1000, 5000].map(amt => (
                                                        <button
                                                            key={amt}
                                                            className="h-14 bg-white border-2 border-slate-50 rounded-2xl text-xs font-black hover:border-emerald-600 hover:text-emerald-600 transition-all active:scale-95"
                                                            onClick={() => setAmount(amt.toString())}
                                                        >
                                                            ₹{amt}
                                                        </button>
                                                    ))}
                                                </div>

                                                <Button 
                                                    className="w-full h-18 text-xl bg-emerald-600 hover:bg-emerald-700 font-black rounded-[30px] shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 py-6"
                                                    onClick={handleInitiatePayment}
                                                    disabled={loading || baseAmount <= 0}
                                                >
                                                    {loading ? <Loader2 className="animate-spin" /> : <Zap className="fill-current w-5 h-5" />}
                                                    Add Funds
                                                </Button>

                                                <div className="flex flex-col items-center gap-4 text-center">
                                                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                                        PCI-DSS Compliant Payments
                                                    </div>
                                                    <button 
                                                        className="text-[10px] font-black text-slate-400 hover:text-emerald-700 transition-colors border-b border-dashed border-slate-200"
                                                        onClick={() => setIsFallback(true)}
                                                    >
                                                        Integration Failed? Use Manual UPI
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="credit"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[32px] overflow-hidden relative">
                                    {isBasic && (
                                        <div className="absolute inset-0 z-50 flex items-center justify-center p-8 bg-white/40 backdrop-blur-md">
                                            <div className="text-center p-8 bg-white rounded-[40px] shadow-2xl border border-slate-50 flex flex-col items-center max-w-xs">
                                                <div className="w-16 h-16 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm ring-4 ring-amber-50/50">
                                                    <Lock className="w-8 h-8 text-amber-500" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 mb-2">Premium Feature</h3>
                                                <p className="text-[11px] font-medium text-slate-400 leading-relaxed mb-8">
                                                    Buy Now Pay Later is exclusive to **Pro** and **Business** accounts.
                                                </p>
                                                <Link to="/upgrade" className="w-full">
                                                    <Button className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 font-black rounded-2xl gap-2 shadow-lg shadow-emerald-100 uppercase tracking-widest text-[11px]">
                                                        Unlock Premium Access <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    <CardContent className="p-8 pt-10">
                                        <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100 flex items-center gap-4 mb-8">
                                            <div className="bg-white p-3 rounded-2xl shadow-sm ring-4 ring-emerald-100/50">
                                                <Trophy className="w-6 h-6 text-amber-500 fill-amber-500" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest opacity-60">Credit Pool</p>
                                                <p className="text-lg font-black text-slate-900">₹{limits.bnplLimit.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">Desired Credit Amount</p>
                                                <div className="relative group">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₹</span>
                                                    <Input
                                                        type="number"
                                                        className="px-12 text-4xl font-black h-24 bg-slate-50 border-none rounded-[28px] focus:ring-4 focus:ring-emerald-50 tabular-nums"
                                                        placeholder="0"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Term</span>
                                                    <span className="text-sm font-black text-slate-900">{limits.bnplCycleDays} Days</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Fee</span>
                                                    <span className="text-sm font-black text-emerald-600">Free</span>
                                                </div>
                                            </div>

                                            <Button 
                                                className="w-full h-18 text-xl bg-slate-900 hover:bg-slate-800 font-black rounded-[30px] shadow-2xl shadow-slate-200 transition-all flex items-center justify-center gap-3 active:scale-95 py-6"
                                                onClick={handleBNPLRequest}
                                                disabled={loading || baseAmount <= 0}
                                            >
                                                {loading ? <Loader2 className="animate-spin" /> : <Landmark className="w-5 h-5 text-emerald-400" />}
                                                Get Instant Credit
                                            </Button>

                                            <div className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                <Info className="w-4 h-4 text-blue-500 shrink-0" />
                                                <p className="text-[9px] font-bold text-blue-600 leading-relaxed uppercase tracking-widest">
                                                    Approval is instant based on your executive account standing. Repay on time to maintain your credit pool.
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </Layout>
    );
};

export default FundRequestPage;
