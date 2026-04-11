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
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout showBottomNav={true}>
            <div className="container max-w-md mx-auto py-8 space-y-6 px-4">
                <h1 className="text-2xl font-bold text-center">Fund Request</h1>

                <Card className="shadow-lg border-slate-100">
                    <CardHeader>
                        <CardTitle>Add Money to Wallet</CardTitle>
                        <CardDescription>Enter amount to add. Processing charges apply.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* KYC Limit Banner */}
                        {!kycLoading && (
                            <div className={`p-3 rounded-lg flex items-start gap-3 border ${isApproved ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                                {isApproved ? (
                                    <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold ${isApproved ? 'text-green-800' : 'text-amber-800'}`}>
                                        {limits.name} Limit: ₹{DISPLAY_LIMIT === Infinity ? 'Unlimited' : DISPLAY_LIMIT.toLocaleString()} / day
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider"> Max Balance: ₹{limits.maxWalletBalance.toLocaleString()} </p>
                                    {!isApproved && (
                                        <p className="text-xs text-amber-600 mt-1">
                                            KYC verification is required to unlock full services. 
                                            {planId === 'BASIC' && ' Upgrade to Pro for ₹10,000 daily limit!'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {isFallback ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="text-center p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center">
                                    <div className="bg-white p-3 rounded-2xl shadow-sm mb-4">
                                        {/* Use a simple QR code API for reliability */}
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=jeevasuriya2007-1@okicici&pn=PrePe&am=${totalPayable}&cu=INR`)}`}
                                            alt="UPI QR Code"
                                            className="w-48 h-48"
                                        />
                                    </div>
                                    <p className="text-sm font-bold text-indigo-900 mb-1">UPI ID: jeevasuriya2007-1@okicici</p>
                                    <p className="text-xs text-indigo-600">Scan & Pay ₹{totalPayable}</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Transaction ID / Ref Number</label>
                                        <Input
                                            placeholder="Eg: 4123891023..."
                                            value={transactionId}
                                            onChange={(e) => setTransactionId(e.target.value)}
                                            className="bg-slate-50 border-slate-200 h-12 text-lg font-mono"
                                        />
                                    </div>
                                    <Button
                                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold"
                                        onClick={handleManualSubmit}
                                        disabled={loading || !transactionId}
                                    >
                                        {loading ? <Loader2 className="animate-spin mr-2" /> : "Request Admin to Fund"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-slate-400 text-xs"
                                        onClick={() => setIsFallback(false)}
                                    >
                                        Try Online Payment Again
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Amount Input */}
                                <div className="space-y-4">
                                    <div className="relative">
                                        <span className="absolute left-3 top-3.5 text-xl font-bold text-slate-400">₹</span>
                                        <Input
                                            type="number"
                                            className="pl-8 text-xl font-bold h-14 bg-slate-50 border-slate-200"
                                            placeholder="1000"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    </div>
                                    {baseAmount > DISPLAY_LIMIT && DISPLAY_LIMIT !== Infinity && (
                                        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Amount exceeds your daily limit of ₹{DISPLAY_LIMIT.toLocaleString()}
                                        </p>
                                    )}

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                                        <div className="flex justify-between items-center font-bold text-lg text-slate-900">
                                            <span>Amount to Add</span>
                                            <span className="text-green-700">₹{baseAmount}</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">No processing charges — what you pay is what gets added.</p>
                                    </div>
                                </div>

                                {/* Quick Select */}
                                <div className="flex gap-2">
                                    {[500, 1000, 5000].map(amt => (
                                        <Button
                                            key={amt}
                                            variant="outline"
                                            className={`flex-1 border-slate-200 ${amt > DISPLAY_LIMIT && DISPLAY_LIMIT !== Infinity ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-50'}`}
                                            onClick={() => (DISPLAY_LIMIT === Infinity || amt <= DISPLAY_LIMIT) && setAmount(amt.toString())}
                                            disabled={DISPLAY_LIMIT !== Infinity && amt > DISPLAY_LIMIT}
                                        >
                                            ₹{amt}
                                        </Button>
                                    ))}
                                </div>

                                <Button
                                    className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800"
                                    onClick={handleInitiatePayment}
                                    disabled={loading || baseAmount <= 0 || (DISPLAY_LIMIT !== Infinity && baseAmount > DISPLAY_LIMIT) || kycLoading}
                                >
                                    {loading ? <Loader2 className="animate-spin mr-2" /> : <WalletIcon className="mr-2 h-5 w-5" />}
                                    Pay ₹{totalPayable}
                                </Button>

                                <Button
                                    variant="link"
                                    className="w-full text-slate-400 text-xs mt-2"
                                    onClick={() => setIsFallback(true)}
                                >
                                    Having trouble? Pay via UPI QR
                                </Button>
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
