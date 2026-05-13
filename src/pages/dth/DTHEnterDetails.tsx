
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getOperators } from '@/services/operator.service';
import type { Operator, RechargePlan } from '@/types/recharge.types';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchDTHCustomerDetails, DTHCustomerInfoResponse } from '@/services/kwikApiService';
import { Loader2 } from "lucide-react";
import { getPlans } from '@/services/plans.service';
import { processRecharge } from '@/services/recharge.service';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { upiService } from "@/services/upi";
import { QRCodeSVG } from "qrcode.react";
import { useKYC } from "@/hooks/useKYC";
import { KYCNudgeDialog } from "@/components/kyc/KYCNudgeDialog";

export const DTHEnterDetails = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { availableBalance, refetch: refetchWallet } = useWallet();
    const { isApproved } = useKYC();
    const { toast } = useToast();

    const operatorId = searchParams.get('operator');
    const [operator, setOperator] = useState<Operator | null>(null);
    const [dthId, setDthId] = useState("");
    const [amount, setAmount] = useState("");
    const [registeredMobile, setRegisteredMobile] = useState(""); // Optional if not strict, but good to have

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

    const fetchInfo = async () => {
        if (!operator || dthId.length < 6) return;
        setFetchingInfo(true);
        const result = await fetchDTHCustomerDetails(operator.id, dthId);
        if (result.status === 'SUCCESS' && result.response?.info?.length) {
            setCustomerInfo(result.response.info[0]);
            // Auto-fill amount if monthly recharge available
            if (result.response.info[0].monthlyRecharge) {
                // Clean up amount string if needed
                setAmount(result.response.info[0].monthlyRecharge.replace(/[^0-9.]/g, ''));
            }
        }
        setFetchingInfo(false);
    };

    const handleConfirm = () => {
        if (!dthId) {
            toast({ title: "Required", description: "Please enter Subscriber ID", variant: "destructive" });
            return;
        }
        // Basic validation logic here...
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
            // Initiate Split Payment Flow (UPI first)
            initiateSplitPayment(rechargeAmount);
            return;
        }

        // Direct Wallet Payment
        setProcessing(true);
        const result = await processRecharge(user.id, {
            dth_id: dthId,
            operator_id: operator.id,
            amount: rechargeAmount,
            mobile_number: registeredMobile // Pass if collected
        });

        setProcessing(false);
        setShowConfirm(false);

        if (result.status === 'SUCCESS') {
            toast({ title: 'Success', description: 'Recharge Successful!' });
            navigate('/home'); // Or receipt page
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
                    // Refresh wallet to get new balance
                    await refetchWallet();
                    // Proceed with recharge automatically
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
        // Re-calculate or assume balance is now sufficient
        // Add a small delay to ensure wallet update propagation
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
                toast({ title: 'Success', description: 'Recharge Successful!' });
                navigate('/home');
            } else {
                toast({ title: 'Recharge Failed', description: result.message, variant: 'destructive' });
            }
        }, 1500);
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    const needsSplitPayment = parseFloat(amount || "0") > availableBalance;
    const payFromWallet = needsSplitPayment ? availableBalance : parseFloat(amount || "0");
    const payFromUpi = needsSplitPayment ? (parseFloat(amount || "0") - availableBalance) : 0;

    return (
        <Layout title="Enter Details" showBack>
            <div className="bg-slate-50 min-h-screen p-4 space-y-6 relative">
                {/* Bharat Connect Logo */}
                <div className="absolute top-2 right-4 opacity-70">
                    <img 
                        src="/bharat-connect.svg" 
                        alt="Bharat Connect"
                        className="h-6 w-auto grayscale contrast-125" 
                    />
                </div>

                {/* Operator Header Card */}
                {operator && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 p-1 bg-white border rounded-full">
                                <AvatarImage src={operator.logo || ''} />
                                <AvatarFallback>{operator.name[0]}</AvatarFallback>
                            </Avatar>
                            <span className="font-semibold text-slate-800">{operator.name}</span>
                        </div>
                        <Button variant="ghost" className="text-blue-600 hover:text-blue-700 h-auto p-0 font-medium" onClick={() => navigate(-1)}>Change</Button>
                    </div>
                )}

                {/* Input Fields */}
                <div className="space-y-4">
                    <Input
                        placeholder="Customer ID / Subscriber ID"
                        className="h-14 text-lg bg-white border-slate-200"
                        value={dthId}
                        onChange={(e) => setDthId(e.target.value)}
                        onBlur={fetchInfo}
                    />
                    {fetchingInfo && <span className="text-xs text-blue-500 animate-pulse">Fetching details...</span>}
                </div>

                {/* Customer Info Card if fetched */}
                {customerInfo && (
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-3">
                        <h4 className="text-sm font-semibold text-slate-500">DTH Info:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <span className="text-slate-500">Name:</span>
                            <span className="font-medium text-right">{customerInfo.customerName}</span>
                            <span className="text-slate-500">Balance:</span>
                            <span className="font-medium text-right text-green-600">₹{customerInfo.balance}</span>
                            <span className="text-slate-500">Plan:</span>
                            <span className="font-medium text-right">{customerInfo.planname}</span>
                        </div>
                    </div>
                )}

                {/* Amount Input */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <span className="text-xs text-slate-400 font-medium ml-1">Enter Amount</span>
                    <div className="flex items-center mt-1">
                        <span className="text-2xl font-bold text-slate-700 mr-1">₹</span>
                        <Input
                            className="border-0 shadow-none text-2xl font-bold p-0 h-auto focus-visible:ring-0 placeholder:text-slate-300"
                            placeholder="0"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                </div>

                <Button className="w-full h-12 text-lg font-medium bg-slate-400 hover:bg-slate-500 text-white mt-4" onClick={handleConfirm} disabled={!amount || !dthId}>
                    Confirm
                </Button>

                {/* Recent Transactions Mock */}
                <div className="mt-8 space-y-3">
                    <h3 className="font-semibold text-slate-700">Recent Transactions</h3>
                    {/* Add Map logic later */}
                    <div className="bg-white p-3 rounded-lg border border-slate-100 flex justify-between items-center opacity-70">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">D2H</div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">Videocon D2H</span>
                                <span className="text-xs text-slate-400">217057485</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog / Bottom Sheet Style */}
            <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
                <DialogContent className="max-w-md rounded-2xl gap-0 p-0 overflow-hidden bg-slate-50">
                    <div className="p-0">
                        {/* Header Info - Blue/Theme Background similar to screenshot top bar if possible, or clean white */}
                        <div className="bg-white p-4 flex items-center gap-3 border-b border-slate-100">
                            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2" onClick={() => setShowConfirm(false)}>
                                {/* Back Icon simulated by Dialog Close usually, but visuals aid */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
                            </Button>
                            <Avatar className="h-10 w-10 border p-1 bg-white">
                                <AvatarImage src={operator?.logo || ''} />
                                <AvatarFallback>{operator?.name[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-800 leading-tight">{dthId}</span>
                                <span className="text-xs text-slate-500 font-medium">{operator?.name}</span>
                            </div>
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">

                            {/* Plan Details Card */}
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 text-center space-y-4">
                                <div>
                                    <div className="text-3xl font-black text-slate-900">₹{amount}</div>
                                    <button className="text-xs font-bold text-blue-600 mt-1" onClick={() => setShowConfirm(false)}>Change Amount</button>
                                </div>

                                {/* DTH Specific Details or Generic */}
                                <div className="space-y-3 pt-2 text-left">
                                    <div className="flex justify-between border-b border-slate-50 pb-2">
                                        <span className="text-sm text-slate-400 font-medium">Customer Name</span>
                                        <span className="text-sm font-bold text-slate-700">{customerInfo?.customerName || 'N/A'}</span>
                                    </div>

                                    {customerInfo?.planname && (
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-sm text-slate-400 font-medium">Current Plan</span>
                                            <span className="text-sm font-bold text-slate-700 text-right max-w-[60%] truncate">{customerInfo.planname}</span>
                                        </div>
                                    )}

                                    <div className="bg-blue-50/50 rounded-lg p-3 text-xs text-slate-500 leading-relaxed">
                                        <span className="font-semibold text-blue-700 block mb-1">Benefits:</span>
                                        {customerInfo?.planname
                                            ? `Renews your existing ${customerInfo.planname}. Enjoy uninterrupted DTH services.`
                                            : "Top-up your DTH account balance. Valid for existing plan extension or new pack activation."}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Breakdown Card */}
                            {upiState ? (
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center space-y-4">
                                    <h3 className="font-bold text-slate-800">Complete Payment</h3>
                                    <div className="bg-white p-2 rounded-xl border inline-block">
                                        <QRCodeSVG value={upiState.qrData} size={160} />
                                    </div>
                                    <p className="text-xs text-slate-500">Scan QR to pay remaining ₹{payFromUpi.toFixed(2)}</p>
                                    <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-sm">
                                        <a href={upiState.intentUrl}>Pay via UPI App</a>
                                    </Button>
                                    <div className="flex items-center justify-center text-xs text-blue-600 animate-pulse">
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Waiting...
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium text-sm">Transaction Amount</span>
                                        <span className="font-bold text-slate-900">₹{parseFloat(amount || '0').toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-500 font-medium text-sm">Your Balance</span>
                                        <span className="font-bold text-slate-900">₹{availableBalance.toFixed(2)}</span>
                                    </div>
                                    <div className="h-px bg-slate-100 my-1"></div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-800 font-bold">Payable Amount</span>
                                        <span className="font-bold text-slate-900 text-lg">
                                            ₹{(needsSplitPayment ? payFromUpi : 0).toFixed(2)}
                                        </span>
                                    </div>
                                    {!needsSplitPayment && (
                                        <div className="text-xs text-green-600 text-right font-medium flex justify-end items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="20 6 9 17 4 12" /></svg>
                                            Fully covered by Wallet
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Warning */}
                            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-orange-800 text-xs leading-relaxed">
                                <span className="font-bold block mb-1 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                    Important Alert!
                                </span>
                                Please check your number and amount carefully before proceeding. Once the transaction is successful, it cannot be reversed.
                            </div>
                        </div>

                        {/* Fixed Footer Button */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <Button
                                className="w-full h-12 text-lg font-bold bg-[#3b5998] hover:bg-[#2d4373] shadow-lg shadow-blue-900/10 rounded-xl"
                                onClick={handleProceedToPay}
                                disabled={processing || !!upiState}
                            >
                                {processing ? <Loader2 className="animate-spin mr-2" /> : null}
                                {upiState ? 'Complete UPI Payment' : 'Proceed to Pay'}
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
