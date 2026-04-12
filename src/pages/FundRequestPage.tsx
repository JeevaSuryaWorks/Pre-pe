import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { KYCNudgeDialog } from "@/components/kyc/KYCNudgeDialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { upiService } from "@/services/upi";
import { toast } from "sonner";
import { Loader2, AlertCircle, ShieldCheck, Wallet as WalletIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { useKYC } from "@/hooks/useKYC";
import { backendWalletService } from "@/services/backendWallet.service";
import { useAuth } from "@/hooks/useAuth";
import { manualFundService } from "@/services/manualFund.service";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useWallet } from "@/hooks/useWallet";

export const FundRequestPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { status: kycStatus, isApproved, isLoading: kycLoading } = useKYC();
    const { user } = useAuth(); // New: Get user from useAuth
    const [amount, setAmount] = useState(location.state?.amount?.toString() || "0");
    const [loading, setLoading] = useState(false);
    const [showKYCNudge, setShowKYCNudge] = useState(false);
    const [isFallback, setIsFallback] = useState(false);
    const [transactionId, setTransactionId] = useState("");
    const [showManualModal, setShowManualModal] = useState(false);
    
    const { limits, checkWalletAddLimit, planId } = usePlanLimits();
    const { balance: currentBalance } = useWallet();

    // Limit Logic
    // Plan-based dynamic limit display
    const DISPLAY_LIMIT = limits.dailyWalletAddLimit;

    const baseAmount = Number(amount) || 0;
    const totalPayable = baseAmount; // No processing charges

    // New: Razorpay script loader
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
        if (!user) return;

        if (!kycStatus) {
            navigate('/kyc');
            return;
        }

        if (kycStatus === 'REJECTED') {
            toast.error("Your KYC was rejected. Please resubmit to add funds.");
            navigate('/kyc');
            return;
        }

        if (!baseAmount || baseAmount < 1) {
            toast.error("Enter a valid amount");
            return;
        }

        // Check Daily Add Limit
        const addLimitCheck = await checkWalletAddLimit(baseAmount);
        if (!addLimitCheck.allowed) {
            toast.error(`Daily limit reached. Your ${limits.name} allows ₹${limits.dailyWalletAddLimit} per day. Upgrade for higher limits!`);
            return;
        }

        // Check Max Balance
        if (currentBalance + baseAmount > limits.maxWalletBalance) {
            toast.error(`Wallet balance cannot exceed ₹${limits.maxWalletBalance.toLocaleString()} on ${limits.name}. Upgrade to increase limit!`);
            return;
        }

        setLoading(true);
        try {
            // 1. Create Order on Server
            const orderData = await backendWalletService.createOrder(totalPayable); // Total payable including charges

            if (!orderData || !orderData.id) {
                toast.error("Failed to create payment order");
                return;
            }

            // 2. Load Razorpay script
            const res = await loadRazorpay();

            if (!res) {
                toast.error('Razorpay SDK failed to load. Are you online?');
                return;
            }

            // 3. Razorpay options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_YOUR_KEY_HERE",
                amount: orderData.amount, // From server order
                currency: orderData.currency,
                name: "PrePe Wallet",
                description: `Wallet Topup: ₹${baseAmount}`,
                image: "/icon.png",
                order_id: orderData.id, // Pass server-generated Order ID
                handler: async function (response: any) {
                    // 4. Verify Payment on Server
                    try {
                        const verification = await backendWalletService.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            amount: baseAmount // Credit the base amount (excluding charges)
                        });

                        if (verification) {
                            toast.success(`Payment Successful! Wallet credited with ₹${baseAmount}.`);
                            navigate('/home');
                        } else {
                            toast.error("Payment valid but wallet update pending. Contact support.");
                        }
                    } catch (error: any) {
                        console.error(error);
                        toast.error(error.message || "Payment verification failed");
                    }
                },
                prefill: {
                    name: user?.user_metadata?.full_name || "User",
                    email: user?.email,
                    contact: user?.phone || ""
                },
                notes: {
                    address: "PrePe India"
                },
                theme: {
                    color: "#0f172a"
                }
            };

            const paymentObject = new (window as any).Razorpay(options);
            paymentObject.open();

        } catch (e: any) {
            console.error(e);
            const isConnectionError = e.message?.includes("Failed to fetch") || e.message?.includes("ERR_CONNECTION_REFUSED");

            if (isConnectionError) {
                toast.error("Backend server is unreachable. Fallback to manual UPI available.");
                setIsFallback(true);
            } else {
                toast.error(e.message || "Failed to initiate payment");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleManualSubmit = async () => {
        if (!user || !transactionId || !baseAmount) {
            toast.error("Please provide Transaction ID");
            return;
        }

        setLoading(true);
        try {
            await manualFundService.submitRequest(user.id, baseAmount, transactionId);
            toast.success("Fund request submitted successfully. Admin will verify it shortly.");
            navigate('/home');
        } catch (error: any) {
            toast.error(error.message || "Failed to submit request");
        }
    };

    return (
        <Layout showBottomNav={true}>
            <div className="container max-w-md mx-auto py-8 space-y-6 px-4">
                <div className="flex flex-col items-center text-center gap-1">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Topup Wallet</h1>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Secure UPI Gateway</p>
                </div>

                <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.05)] border-slate-100 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-black tracking-tight">Add Money to Wallet</CardTitle>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Direct wallet credit in seconds</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* KYC Limit Banner */}
                        {!kycLoading && (
                            <div className={`p-4 rounded-3xl flex items-start gap-3 border ${isApproved ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {isApproved ? (
                                        <ShieldCheck className="w-5 h-5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-xs font-black uppercase tracking-wider ${isApproved ? 'text-emerald-800' : 'text-amber-800'}`}>
                                        {limits.name} Limit
                                    </p>
                                    <p className="text-lg font-black text-slate-900">₹{DISPLAY_LIMIT === Infinity ? 'Unlimited' : DISPLAY_LIMIT.toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase">/ day</span></p>
                                    {!isApproved && (
                                        <p className="text-[10px] text-amber-700/70 mt-1 font-bold">
                                            Complete KYC to unlock higher limits.
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {isFallback ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center p-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center">
                                    <div className="bg-white p-4 rounded-3xl shadow-sm mb-4 border border-slate-100">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=jeevasuriya2007-1@okicici&pn=PrePe&am=${totalPayable}&cu=INR`)}`}
                                            alt="UPI QR Code"
                                            className="w-44 h-44"
                                        />
                                    </div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">UPI ID</p>
                                    <p className="text-sm font-black text-slate-800 bg-white px-4 py-2 rounded-full border border-slate-100 shadow-sm">jeevasuriya2007-1@okicici</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Transaction Ref Number</label>
                                        <Input
                                            placeholder="Eg: 4123891023..."
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="bg-slate-50 border-slate-200 h-14 text-lg font-black tracking-widest rounded-2xl"
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-14 bg-slate-900 hover:bg-indigo-600 font-black rounded-2xl shadow-xl shadow-slate-200 transition-all"
                                        onClick={handleManualSubmit}
                                        disabled={loading || !transactionId}
                                    >
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Verify Payment"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest"
                                        onClick={() => setIsFallback(false)}
                                    >
                                        Back to Online Payment
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Amount Input */}
                                <div className="space-y-4">
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 group-focus-within:text-indigo-600 transition-colors">₹</span>
                                        <Input
                                            type="number"
                                            className="pl-12 pr-6 text-3xl font-black h-20 bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-100 focus:ring-4 focus:ring-indigo-50/50 rounded-2xl transition-all tabular-nums"
                                            placeholder="0"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>

                                    {/* Quick Select Grid */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[500, 1000, 5000].map(amt => (
                                            <button
                                                key={amt}
                                                className={`h-12 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                                    (DISPLAY_LIMIT !== Infinity && amt > DISPLAY_LIMIT)
                                                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                                                    : 'bg-white border border-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white shadow-sm active:scale-95'
                                                }`}
                                                onClick={() => (DISPLAY_LIMIT === Infinity || amt <= DISPLAY_LIMIT) && setAmount(amt.toString())}
                                                disabled={DISPLAY_LIMIT !== Infinity && amt > DISPLAY_LIMIT}
                                            >
                                                ₹{amt}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-indigo-900/60 uppercase tracking-widest">Total Payable</span>
                                            <span className="text-2xl font-black text-indigo-900 tabular-nums">₹{baseAmount.toLocaleString()}</span>
                                        </div>
                                        <p className="text-[9px] text-indigo-400 mt-1 font-bold uppercase tracking-wider">Zero processing fees applied</p>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-16 text-lg font-black bg-slate-950 hover:bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                                    onClick={handleInitiatePayment}
                                    disabled={loading || baseAmount <= 0 || (DISPLAY_LIMIT !== Infinity && baseAmount > DISPLAY_LIMIT) || kycLoading}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <WalletIcon className="h-6 w-6" />}
                                    Initiate Recharge
                                </Button>

                                <div className="flex flex-col items-center gap-3 mt-4">
                                    <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                        RBI Regulated Gateway
                                    </div>
                                    <button
                                        className="text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors"
                                        onClick={() => setIsFallback(true)}
                                    >
                                        Payment Failed? Use QR
                                    </button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            <KYCNudgeDialog
                isOpen={showKYCNudge}
                onClose={() => setShowKYCNudge(false)}
                featureName="Add Money"
                reason="RBI guidelines require KYC for wallet top-ups."
            />
        </Layout>
    );
};
