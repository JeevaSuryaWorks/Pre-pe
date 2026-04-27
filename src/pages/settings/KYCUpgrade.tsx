import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle2, FileCheck, ShieldCheck, BadgeCheck, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useKYC } from "@/hooks/useKYC";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { PaymentButton } from "@/components/payment/PaymentButton";


const KYCUpgrade = () => {
    const navigate = useNavigate();
    const { status, kycData, isLoading } = useKYC();

    useEffect(() => {
        if (!isLoading && status !== 'APPROVED') {
            navigate('/kyc', { replace: true });
        }
    }, [status, isLoading, navigate]);

    if (isLoading) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-widest text-[10px]">Verifying Status...</div>;
    if (status !== 'APPROVED') return null;

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center w-full">
            <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen relative flex flex-col pb-10">
                
                {/* Premium Header */}
                <div className="bg-white/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100/50 shadow-sm">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100" 
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Verification</h1>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                </div>

                <div className="p-8 flex flex-col items-center text-center space-y-10">
                    {/* Hero Success Section */}
                    <div className="relative">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                            className="h-32 w-32 bg-emerald-100 rounded-[2.5rem] flex items-center justify-center relative z-10"
                        >
                            <BadgeCheck className="h-16 w-16 text-emerald-600" />
                        </motion.div>
                        <div className="absolute inset-0 bg-emerald-400 rounded-[2.5rem] blur-[40px] opacity-20 scale-125 animate-pulse"></div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">You're Verified!</h2>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed max-w-[280px]">
                            Full access to premium features <br />and unlimited transactions.
                        </p>
                    </div>

                    {/* Verification Details Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white space-y-4"
                    >
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <FileCheck className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-slate-800 tracking-tight">Aadhaar Identity</p>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                                        VERIFIED • XXXX {kycData?.decrypted_aadhar ? kycData.decrypted_aadhar.slice(-4) : 'XXXX'}
                                    </p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                    <FileCheck className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-slate-800 tracking-tight">PAN Tax Identity</p>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
                                        VERIFIED • XXXX {kycData?.decrypted_pan ? kycData.decrypted_pan.slice(-4) : 'XXXX'}
                                    </p>
                                </div>
                            </div>
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                    </motion.div>

                    {/* Elite Benefits Card */}
                    <div className="w-full p-6 bg-slate-900 rounded-[2.5rem] text-left relative overflow-hidden group shadow-2xl">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0">
                                <Zap className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Elite Status Active</h3>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 leading-relaxed">
                                    You can now request higher fund limits, redeem unlimited rewards, and enjoy priority 24/7 support.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Top-up Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="w-full bg-indigo-50/50 rounded-[2.5rem] p-6 border border-indigo-100/50 space-y-4"
                    >
                        <div className="text-left">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Add Funds</h3>
                            <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">
                                Instant wallet top-up via UPI, Cards, or NetBanking.
                            </p>
                        </div>
                        
                        <PaymentButton 
                            label="Top up ₹500"
                            className="w-full"
                            options={{
                                amount: 500,
                                currency: 'INR',
                                name: 'Pre-pe Wallet',
                                description: 'Wallet Top-up',
                                prefill: {
                                    name: 'Gaurav Kumar', // Should be dynamic
                                    email: 'gaurav.kumar@example.com',
                                    contact: '9123456780'
                                },
                                notes: {
                                    purpose: 'wallet_topup'
                                }
                            }}
                        />
                    </motion.div>

                    {/* International Subscription Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full bg-amber-50/50 rounded-[2.5rem] p-6 border border-amber-100/50 space-y-4"
                    >
                        <div className="text-left">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Global Premium</h3>
                            <p className="text-[10px] font-bold text-slate-500 mt-1 leading-relaxed">
                                Access international rewards and global services.
                            </p>
                        </div>
                        
                        <PaymentButton 
                            label="Upgrade for $10"
                            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                            options={{
                                amount: 10,
                                currency: 'USD',
                                name: 'Pre-pe Global',
                                description: 'International Subscription',
                                customer_details: {
                                    name: 'Gaurav Kumar',
                                    email: 'gaurav.kumar@example.com',
                                    contact: '9123456780',
                                    shipping_address: {
                                        line1: 'Mantri Apartment',
                                        line2: 'Koramangala',
                                        city: 'Bengaluru',
                                        country: 'IND',
                                        state: 'Karnataka',
                                        zipcode: '560032'
                                    }
                                },
                                notes: {
                                    purpose: 'international_upgrade'
                                }
                            }}
                        />
                    </motion.div>

                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Official Pre-pe Certification</p>
                </div>
            </div>
        </div>
    );
};

export default KYCUpgrade;

