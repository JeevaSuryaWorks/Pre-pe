import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { 
    AlertCircle, ShieldCheck, Wallet as WalletIcon, 
    Lock, ArrowRight, Trophy, Landmark, Info, History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/Layout";
import { useKYC } from "@/hooks/useKYC";
import { useAuth } from "@/hooks/useAuth";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useWallet } from "@/hooks/useWallet";
import { creditWallet } from "@/services/wallet.service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AddMoney } from "@/components/wallet/AddMoney";

export const FundRequestPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { isApproved, isLoading: kycLoading } = useKYC();
    const { refetch: refetchWallet } = useWallet();
    const { limits, planId } = usePlanLimits();

    const [activeTab, setActiveTab] = useState<"cash" | "credit">("cash");
    const [amount, setAmount] = useState(location.state?.amount?.toString() || "");
    const [loading, setLoading] = useState(false);

    const baseAmount = Number(amount) || 0;
    const isBasic = planId.toUpperCase() === "BASIC";

    const handleBNPLRequest = async () => {
        if (!user || !isApproved) {
            toast.error("KYC Approval Required");
            return;
        }
        
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

    if (kycLoading) {
        return (
            <Layout showBottomNav={true}>
                <div className="flex items-center justify-center min-h-screen">
                    <History className="animate-spin h-8 w-8 text-emerald-600" />
                </div>
            </Layout>
        );
    }

    if (!isApproved) {
        return (
            <Layout showBottomNav={true}>
                <div className="container max-w-md mx-auto pt-24 px-6">
                    <Card className="p-8 text-center space-y-6 rounded-[32px] border-none shadow-2xl shadow-emerald-100">
                        <div className="bg-amber-50 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-12 h-12 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900">KYC Required</h2>
                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                            To maintain the highest security standards for financial transactions, please complete your KYC verification first.
                        </p>
                        <Button onClick={() => navigate('/kyc')} className="w-full h-14 bg-emerald-600 rounded-2xl font-black shadow-xl shadow-emerald-100">
                            Complete KYC Now
                        </Button>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showBottomNav={true}>
            <div className="min-h-screen bg-[#F8FAFC] pb-32 relative overflow-hidden">
                {/* Header Background */}
                <div className="h-72 bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800 rounded-b-[50px] absolute top-0 left-0 w-full z-0 shadow-lg overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-400/10 blur-3xl animate-pulse" />
                </div>
                
                <div className="relative z-10 container max-w-md mx-auto pt-14 px-6">
                    <div className="flex flex-col items-center text-center mb-10 text-white">
                        <div className="bg-white/10 p-3 rounded-3xl backdrop-blur-md mb-4 border border-white/20 shadow-lg">
                            <WalletIcon className="w-8 h-8 text-emerald-300" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">Fund Request</h1>
                        <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-[0.3em]">Secure Executive Dash</p>
                    </div>

                    {/* --- Dual Tab Switcher --- */}
                    <div className="bg-emerald-950/40 backdrop-blur-xl p-1.5 rounded-[28px] border border-white/10 flex gap-1 mb-8 shadow-2xl relative">
                        <button 
                            onClick={() => setActiveTab("cash")}
                            className={cn(
                                "flex-1 py-4 px-4 rounded-[22px] flex flex-col items-center gap-1 transition-all relative z-10",
                                activeTab === "cash" ? "text-emerald-950 font-black" : "text-emerald-100/75 hover:text-white font-bold"
                            )}
                        >
                            {activeTab === "cash" && (
                                <motion.div 
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 bg-white rounded-[22px] z-0 shadow-lg shadow-emerald-950/10"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                            <span className="text-[11px] uppercase tracking-widest leading-none relative z-10">Add Cash</span>
                            <span className="text-[9px] opacity-60 relative z-10">UPI / RAZORPAY</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab("credit")}
                            className={cn(
                                "flex-1 py-4 px-4 rounded-[22px] flex flex-col items-center gap-1 transition-all relative z-10",
                                activeTab === "credit" ? "text-emerald-950 font-black" : "text-emerald-100/75 hover:text-white font-bold"
                            )}
                        >
                            {activeTab === "credit" && (
                                <motion.div 
                                    layoutId="activeTabIndicator"
                                    className="absolute inset-0 bg-white rounded-[22px] z-0 shadow-lg shadow-emerald-950/10"
                                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                            )}
                            <span className="text-[11px] uppercase tracking-widest leading-none relative z-10 flex items-center gap-1.5 justify-center">
                                Instant Credit
                                {isBasic && <Lock className="w-3 h-3 text-amber-500 shrink-0" />}
                            </span>
                            <span className="text-[9px] opacity-60 relative z-10">BNPL</span>
                        </button>
                    </div>

                    {/* --- Content Area --- */}
                    <AnimatePresence mode="wait">
                        {activeTab === "cash" ? (
                            <motion.div 
                                key="cash"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white/95 backdrop-blur-md">
                                    <CardContent className="p-4 sm:p-8">
                                        <AddMoney initialAmount={amount} onSuccess={() => navigate('/wallet')} />
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="credit"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[32px] overflow-hidden bg-white/95 backdrop-blur-md relative min-h-[400px]">
                                    {isBasic && (
                                        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-white/70 backdrop-blur-xl">
                                            <motion.div 
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                transition={{ type: 'spring', delay: 0.1 }}
                                                className="text-center p-8 bg-gradient-to-br from-white to-slate-50/50 rounded-[40px] shadow-3xl border border-slate-100/50 flex flex-col items-center max-w-xs relative overflow-hidden"
                                            >
                                                <div className="absolute -top-12 -left-12 w-24 h-24 rounded-full bg-amber-400/10 blur-xl animate-pulse" />
                                                <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 shadow-md shadow-amber-200/20 ring-4 ring-amber-100/40 relative">
                                                    <Lock className="w-9 h-9 text-amber-500 animate-bounce" />
                                                    <span className="absolute inset-0 rounded-3xl bg-amber-400/10 animate-ping duration-1000" />
                                                </div>
                                                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">BNPL Locked</h3>
                                                <p className="text-xs font-medium text-slate-500 leading-relaxed mb-8">
                                                    Instant credit line is exclusive to <strong className="text-emerald-700">Pro</strong> and <strong className="text-emerald-700">Business</strong> users.
                                                </p>
                                                <Link to="/upgrade" className="w-full">
                                                    <Button className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-2xl gap-2 shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-[10px] active:scale-[0.98] transition-all">
                                                        Unlock Premium Access <ArrowRight className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </motion.div>
                                        </div>
                                    )}

                                    <CardContent className="p-8 pt-10">
                                        <div className="bg-emerald-50/80 p-6 rounded-[32px] border border-emerald-100 flex items-center gap-4 mb-8 shadow-inner">
                                            <div className="bg-white p-3 rounded-2xl shadow-sm ring-4 ring-emerald-100/50">
                                                <Trophy className="w-6 h-6 text-amber-500 fill-amber-500" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest opacity-60">Credit Pool</p>
                                                <p className="text-lg font-black text-slate-900">₹{limits.bnplLimit.toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-8">
                                            <div className="space-y-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 text-left">Desired Credit Amount</p>
                                                <div className="relative group">
                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-black text-slate-300 group-focus-within:text-emerald-500 transition-colors">₹</span>
                                                    <input
                                                        type="number"
                                                        className="w-full px-12 text-4xl font-black h-24 bg-slate-50 border-2 border-transparent rounded-[28px] focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50/50 transition-all duration-300 shadow-inner tabular-nums"
                                                        placeholder="0"
                                                        value={amount}
                                                        onChange={(e) => setAmount(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="bg-slate-50/60 p-6 rounded-[32px] border border-slate-100 shadow-inner">
                                                <div className="flex justify-between items-center mb-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Repayment Term</span>
                                                    <span className="text-sm font-black text-slate-900">{limits.bnplCycleDays} Days</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Fee</span>
                                                    <span className="text-sm font-black text-emerald-600">Free</span>
                                                </div>
                                            </div>

                                            <Button 
                                                className="w-full h-18 text-lg bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-950 hover:to-slate-900 text-white font-black rounded-[28px] shadow-xl shadow-slate-900/10 transition-all flex items-center justify-center gap-3 active:scale-[0.98] py-6 relative overflow-hidden"
                                                onClick={handleBNPLRequest}
                                                disabled={loading || baseAmount <= 0}
                                            >
                                                {loading ? <History className="animate-spin text-white" /> : <Landmark className="w-5 h-5 text-emerald-400 fill-emerald-400/20 animate-pulse" />}
                                                Get Instant Credit
                                            </Button>

                                            <div className="flex items-start gap-3 px-4 py-3.5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                                                <p className="text-[9px] font-bold text-blue-600 leading-relaxed uppercase tracking-wider text-left">
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
