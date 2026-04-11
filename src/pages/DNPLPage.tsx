import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { KYCNudgeDialog } from "@/components/kyc/KYCNudgeDialog";
import { ArrowLeft, Landmark, Info, HandCoins, Calendar, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useKYC } from "@/hooks/useKYC";
import { getWalletBalance, creditWallet } from "@/services/wallet.service";
import { useActiveLoan } from "@/hooks/useActiveLoan";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const DNPLPage = () => {
    const { limits, isFeatureEnabled, loading: planLoading, planId } = usePlanLimits();
    const [amount, setAmount] = useState<string>("");
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { isApproved } = useKYC();
    const [showKYCNudge, setShowKYCNudge] = useState(false);
    const { data: activeLoan, isLoading: isLoanLoading } = useActiveLoan();

    const borrowAmount = parseInt(amount) || 0;

    const repaymentDate = new Date();
    repaymentDate.setDate(repaymentDate.getDate() + limits.bnplCycleDays);
    const bounceCharges = 50;

    const { data: balanceObj } = useQuery({
        queryKey: ["wallet-balance"],
        queryFn: async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) throw new Error("Not logged in");
            return await getWalletBalance(session.user.id);
        },
    });

    const borrowMutation = useMutation({
        mutationFn: async (amt: number) => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user?.id) throw new Error("Not logged in");

            const success = await creditWallet(session.user.id, amt, "BNPL Loan Disbursal");
            if (!success) throw new Error("Failed to disburse loan funds to wallet");

            // Log the 'LOAN' transaction
            await supabase.from("transactions").insert({
                user_id: session.user.id,
                type: "LOAN",
                service_type: "WALLET_TOPUP",
                amount: amt,
                status: "SUCCESS",
                metadata: { repayment_date: repaymentDate.toISOString(), bounce_charges: bounceCharges, plan: planId }
            });

            return { success: true, amount: amt };
        },
        onSuccess: () => {
            toast({
                title: "Successfully Borrowed!",
                description: `₹${borrowAmount} has been added to your wallet.`,
            });
            queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
            navigate("/home");
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const handleBorrow = () => {
        if (!isApproved) {
            setShowKYCNudge(true);
            return;
        }

        if (borrowAmount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter an amount to borrow.", variant: "destructive" });
            return;
        }
        if (borrowAmount > limits.bnplLimit) {
            toast({ title: "Limit Exceeded", description: `You can borrow up to ₹${limits.bnplLimit.toLocaleString()} only.`, variant: "destructive" });
            return;
        }
        borrowMutation.mutate(borrowAmount);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center w-full">
            <div className="w-full max-w-md bg-white shadow-2xl min-h-screen relative flex flex-col">
                {/* Header */}
                <div className="p-4 flex items-center gap-4 bg-white border-b sticky top-0 z-10">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-900">Buy Now Pay Later</h1>
                </div>

                <div className="flex-1 p-6 flex flex-col items-stretch">
                    {!isFeatureEnabled('bnpl') && !planLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                             <div className="bg-amber-100 p-6 rounded-full">
                                <ShieldAlert className="w-16 h-16 text-amber-600" />
                             </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900">Premium Feature</h3>
                                <p className="text-slate-500 text-sm leading-relaxed max-w-[280px]">
                                    The Buy Now Pay Later feature is exclusively available for <strong>Pro</strong> and <strong>Business</strong> plan users.
                                </p>
                            </div>
                            
                            <div className="w-full space-y-3 pt-4">
                                <Button 
                                    onClick={() => navigate('/onboarding/plans')}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-indigo-100 text-lg"
                                >
                                    UPGRADE TO PRO
                                </Button>
                                <Button 
                                    variant="ghost"
                                    onClick={() => navigate(-1)}
                                    className="w-full text-slate-400 font-bold"
                                >
                                    Maybe Later
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-500">
                             {/* Hero Section */}
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <h2 className="text-sm font-medium opacity-80 mb-1">Maximum Borrow Limit</h2>
                                    <div className="text-4xl font-bold mb-4">₹{limits.bnplLimit.toLocaleString()}.00</div>
                                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs w-fit">
                                        <Landmark className="w-3 h-3" />
                                        <span>BNPL Powered by NBFC Partners</span>
                                    </div>
                                </div>
                                <HandCoins className="absolute -bottom-4 -right-4 w-32 h-32 opacity-15 rotate-12" />
                            </div>

                            {/* Input Section (Hidden if Active Loan) */}
                            {!activeLoan && !isLoanLoading && (
                                <div className="space-y-4">
                                    <label className="text-sm font-semibold text-slate-700 block ml-1">Enter Borrow Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-400">₹</span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="pl-10 h-16 text-2xl font-bold border-2 border-slate-100 rounded-2xl focus-visible:ring-indigo-500 focus-visible:border-indigo-500"
                                            max={limits.bnplLimit}
                                            min={1}
                                        />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                                        {[100, 200, 500, limits.bnplLimit].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setAmount(val.toString())}
                                                className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${amount === val.toString()
                                                    ? "bg-indigo-600 border-indigo-600 text-white"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                                                    }`}
                                            >
                                                ₹{val}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Preview Summary Card (Hidden if Active Loan) */}
                            {!activeLoan && borrowAmount > 0 && (
                                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Info className="w-4 h-4 text-indigo-500" />
                                        Borrowing Summary
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Repayment Cycle
                                            </span>
                                            <span className="font-semibold text-slate-900">{limits.bnplCycleDays} Days</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-500 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Due Date
                                            </span>
                                            <span className="font-semibold text-slate-900">{repaymentDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                            <span className="text-slate-800 font-bold">Total Dues</span>
                                            <span className="text-indigo-600 font-extrabold">₹{borrowAmount}.00</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                             {/* Active Loan Display */}
                            {activeLoan && (
                                <div className={`rounded-2xl p-5 border shadow-sm space-y-4 ${activeLoan.is_overdue ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className={`font-bold flex flex-col gap-1 ${activeLoan.is_overdue ? 'text-red-800' : 'text-slate-800'}`}>
                                            <span className="flex items-center gap-2">
                                                <Info className={`w-5 h-5 ${activeLoan.is_overdue ? 'text-red-500' : 'text-indigo-500'}`} />
                                                Current Active Loan
                                            </span>
                                        </h3>
                                        <div className={`text-right ${activeLoan.is_overdue ? 'text-red-600' : 'text-indigo-600'}`}>
                                            <div className="text-2xl font-black leading-none">₹{activeLoan.amount + (activeLoan.is_overdue ? activeLoan.bounce_charges : 0)}.00</div>
                                            <div className="text-[10px] font-bold opacity-70 mt-1 uppercase tracking-widest">Total Dues</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 bg-white/50 rounded-xl p-4 border border-white/40">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-600 flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Due Date
                                            </span>
                                            <span className="font-semibold text-slate-900">{activeLoan.repayment_date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>

                                    <Button
                                        className={`w-full h-12 rounded-xl font-bold shadow ${activeLoan.is_overdue ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-900 hover:bg-slate-800'}`}
                                        onClick={() => navigate('/home')}
                                    >
                                        Pay Now
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-white border-t mt-auto">
                    {isFeatureEnabled('bnpl') && (
                        !activeLoan ? (
                            <Button
                                onClick={handleBorrow}
                                disabled={borrowMutation.isPending || borrowAmount <= 0}
                                className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                {borrowMutation.isPending ? "Connecting to Bank..." : "Connect & Borrow Now"}
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={() => navigate('/home')}
                                className="w-full h-14 rounded-2xl font-bold text-lg border-2 border-slate-200 text-slate-500"
                            >
                                Return to Home
                            </Button>
                        )
                    )}
                    {!isFeatureEnabled('bnpl') && (
                        <p className="text-[10px] text-slate-400 text-center uppercase font-black tracking-widest">
                            Powered by PrePe Finance
                        </p>
                    )}
                </div>
            </div>

            <KYCNudgeDialog
                isOpen={showKYCNudge}
                onClose={() => setShowKYCNudge(false)}
                featureName="Borrow Funds"
                reason="Lending services require mandatory KYC verification."
            />
        </div>
    );
};

export default DNPLPage;
