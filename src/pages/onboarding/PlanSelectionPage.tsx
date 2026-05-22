import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
    CheckCircle2, Loader2, Zap, Landmark, Building2, AlertCircle, 
    Smartphone, ShieldCheck, ArrowRight, Search, CreditCard, Crown 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/services/admin';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { paymentService } from '@/services/payment.service';
import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const DEFAULT_PLANS = [
    {
        id: 'BASIC',
        name: 'Basic Plan',
        subtitle: 'Free forever',
        price: 'Free',
        price_amount: 0,
        description: 'Standard recharge and utility tools with no subscription fees.',
        features: [
            'Standard mobile recharges',
            'Basic DTH & utility payments',
            'Wallet top-up limit up to ₹6,000',
            'Simple Mini-KYC verification',
            'Standard transaction support'
        ]
    },
    {
        id: 'PRO',
        name: 'Pro Plan',
        subtitle: '21 days free Trial',
        price: '₹299/month',
        price_amount: 299,
        is_popular: true,
        description: 'Perfect for active users looking for cashback discounts and higher monthly limits.',
        features: [
            'Instant 2-step recharges',
            'All Bharat BillPay (BBPS) bills',
            'Wallet top-up limit up to ₹1,00,000',
            'Premium full KYC verification',
            'Exclusive AI-suggested offers',
            'Priority 24/7 support & zero transaction fees'
        ]
    },
    {
        id: 'BUSINESS',
        name: 'Business Plan',
        subtitle: 'Specially for Shops',
        price: '₹999/month',
        price_amount: 999,
        description: 'Industrial-grade limits, zero commission overheads, and immediate dedicated support.',
        features: [
            'High-volume transaction processing',
            'Unlimited wallet cap',
            'Merchant business KYC verification',
            'Custom invoicing & retail settlement',
            'Premium 2.5% daily cashback points',
            'Dedicated Relationship Manager'
        ]
    }
];

const getPlanIcon = (id: string) => {
    switch (id.toUpperCase()) {
        case 'BASIC': return Landmark;
        case 'PRO': return Crown;
        case 'BUSINESS': return Building2;
        default: return Zap;
    }
};

const getPlanTheme = (id: string) => {
    switch (id.toUpperCase()) {
        case 'BASIC': return { 
            color: 'text-[#046A38]', 
            bgColor: 'bg-[#046A38]/5', 
            grad: 'from-[#046A38]/10 to-[#046A38]/5',
            border: 'border-[#046A38]/20',
            shadow: 'shadow-emerald-900/5'
        };
        case 'PRO': return { 
            color: 'text-[#000080]', 
            bgColor: 'bg-[#000080]/5', 
            grad: 'from-[#000080]/10 to-[#000080]/5',
            border: 'border-[#000080]/20',
            shadow: 'shadow-blue-900/5'
        };
        case 'BUSINESS': return { 
            color: 'text-[#FF671F]', 
            bgColor: 'bg-[#FF671F]/5', 
            grad: 'from-[#FF671F]/10 to-[#FF671F]/5',
            border: 'border-[#FF671F]/20',
            shadow: 'shadow-orange-900/5'
        };
        default: return { 
            color: 'text-[#000080]', 
            bgColor: 'bg-[#000080]/5', 
            grad: 'from-[#000080]/5 to-[#000080]/5',
            border: 'border-[#000080]/10',
            shadow: 'shadow-slate-900/5'
        };
    }
};

export default function PlanSelectionPage() {
    const navigate = useNavigate();
    const { updateProfile } = useProfile();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentMode, setPaymentMode] = useState<'RZP' | 'UPI' | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    useEffect(() => {
        // Load Razorpay Script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        const fetchPlans = async () => {
            try {
                const data = await adminService.getPlans();
                if (data && data.length > 0) {
                    setPlans(data);
                } else {
                    console.log("Empty plan array returned, falling back to default plans.");
                    setPlans(DEFAULT_PLANS);
                }
            } catch (err) {
                console.error("Failed to fetch dynamic plans, falling back:", err);
                setPlans(DEFAULT_PLANS);
                toast({
                    title: "Fetch Warning",
                    description: "Using default plan data.",
                    variant: "default"
                });
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSelectPlan = async (plan: any) => {
        const planId = plan.id;
        setSubmitting(planId);
        setPaymentMode('RZP');
        try {
            // Check if plan is paid
            if (plan.price_amount && plan.price_amount > 0) {
                const orderData = await paymentService.createRazorpayOrder(plan.price_amount);

                if (!window.Razorpay) {
                    throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
                }

                // Open Razorpay Checkout
                const options = {
                    key: orderData.key,
                    amount: orderData.amount,
                    currency: "INR",
                    name: "Pre-pe India",
                    description: `Plan Upgrade: ${plan.name}`,
                    order_id: orderData.id,
                    handler: async (response: any) => {
                        setSubmitting(planId); // Set loading while verifying
                        try {
                            const verifyData = await paymentService.verifyRazorpay({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (!verifyData || !verifyData.success) {
                                toast({
                                    title: "Payment Failure",
                                    description: "Signature verification failed. Please contact support.",
                                    variant: "destructive"
                                });
                                setSubmitting(null);
                                setPaymentMode(null);
                                return;
                            }

                            // Success!
                            await updateProfile({ plan_type: planId });
                            toast({
                                title: "Plan Activated!",
                                description: `Welcome to the ${plan.name} plan.`,
                            });
                            navigate('/kyc');
                        } catch (error) {
                            toast({
                                title: "Payment Failure",
                                description: "Signature verification failed. Please contact support.",
                                variant: "destructive"
                            });
                            setSubmitting(null);
                            setPaymentMode(null);
                        }
                    },
                    modal: {
                        onblur: () => { setSubmitting(null); setPaymentMode(null); }
                    },
                    prefill: {
                        email: (await supabase.auth.getUser()).data.user?.email || ""
                    },
                    theme: { color: "#000080" }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
                return;
            }

            // --- FREE PLAN FLOW ---
            const success = await updateProfile({ plan_type: planId });
            
            if (success) {
                toast({
                    title: "Plan Selected",
                    description: `You've successfully selected the ${plan.name}.`,
                });
                navigate('/kyc');
            } else {
                toast({
                    title: "Update Failed",
                    description: "We couldn't update your plan. Please try again.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
             toast({
                title: "Error",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setSubmitting(null);
            setPaymentMode(null);
        }
    };

    const handleUpiUpgrade = async (plan: any) => {
        const planId = plan.id;
        setSubmitting(planId);
        setPaymentMode('UPI');
        try {
            const { intent_url, reference_id } = await paymentService.createUpiIntent(plan.price_amount);
            
            // Open UPI App
            if (Capacitor.isNativePlatform()) {
                window.open(intent_url, '_system');
            } else {
                window.location.href = intent_url;
            }

            // Start Polling
            const interval = setInterval(async () => {
                try {
                    const result = await paymentService.getPaymentStatus(reference_id);
                    if (result.status === 'SUCCESS') {
                        clearInterval(interval);
                        // Complete Upgrade
                        const { error } = await supabase.from('profiles')
                            .update({ plan_type: planId })
                            .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
                        
                        if (error) throw error;

                        toast({ title: "Plan Activated!", description: `Welcome to the ${plan.name} plan.` });
                        navigate('/kyc');
                        setSubmitting(null);
                        setPaymentMode(null);
                    } else if (result.status === 'FAILED') {
                        clearInterval(interval);
                        toast({ title: "Payment Failed", description: "The transaction was unsuccessful.", variant: "destructive" });
                        setSubmitting(null);
                        setPaymentMode(null);
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 4000);

            // Cleanup interval after 5 minutes
            setTimeout(() => {
                clearInterval(interval);
                if (submitting === planId) {
                    setSubmitting(null);
                    setPaymentMode(null);
                }
            }, 300000);

        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
            setSubmitting(null);
            setPaymentMode(null);
        }
    };

    const filteredPlans = plans.filter(plan => 
        plan.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        plan.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <Layout hideHeader>
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-blue-100 rounded-full animate-pulse" />
                            <Loader2 className="w-12 h-12 animate-spin text-[#000080] absolute inset-0" />
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Loading patriotic plans...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout hideHeader>
            <div className="min-h-screen pt-12 pb-24 px-4 bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/5 relative overflow-hidden">
                {/* Immersive tri-color mesh background */}
                <div className="absolute top-0 left-0 w-80 h-80 bg-[#FF671F]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-white/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#046A38]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

                <div className="max-w-6xl mx-auto space-y-10 relative z-10">
                    <div className="text-center space-y-4 max-w-lg mx-auto">
                        <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-2 ring-8 ring-slate-50 border border-slate-100">
                            <Smartphone className="w-8 h-8 text-[#000080]" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-none">Choose Your Plan</h1>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed px-4">
                            Pick the right plan that fits your needs. Each plan unlocks different features and requires specific verification. 🇮🇳
                        </p>

                        <div className="relative max-w-sm mx-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search plans..."
                                className="pl-12 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-[#FF671F]/20 focus:border-[#FF671F]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch justify-center w-full px-2 max-w-5xl mx-auto">
                        <AnimatePresence>
                            {filteredPlans.map((plan, index) => {
                                const Icon = getPlanIcon(plan.id);
                                const theme = getPlanTheme(plan.id);
                                const isBasic = plan.id.toUpperCase() === 'BASIC';
                                const isPro = plan.id.toUpperCase() === 'PRO';
                                const isBusiness = plan.id.toUpperCase() === 'BUSINESS';
                                const isPopular = plan.is_popular || isPro;

                                return (
                                    <motion.div
                                        key={plan.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1, duration: 0.5 }}
                                        className="flex flex-col h-full w-full max-w-md mx-auto lg:max-w-none"
                                    >
                                        <Card className={cn(
                                            "relative w-full flex-1 flex flex-col transition-all duration-500 bg-white/80 backdrop-blur-xl rounded-[32px] overflow-hidden border border-white/50 shadow-xl hover:shadow-2xl hover:translate-y-[-4px]",
                                            isPro ? "ring-2 ring-[#000080]/30 shadow-[#000080]/10" : ""
                                        )}>
                                            {/* Dynamic Patriotic Top Border */}
                                            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-[#FF671F] via-[#FFFFFF] to-[#046A38] z-20" />
                                            
                                            {isPopular && (
                                                <div className={cn(
                                                    "absolute top-5 right-5 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-md z-10",
                                                    isPro ? "bg-[#000080]" : isBusiness ? "bg-[#FF671F]" : "bg-[#046A38]"
                                                )}>
                                                    Best Value
                                                </div>
                                            )}
                                            
                                            <CardHeader className="text-center pb-2 relative pt-10">
                                                <div className={cn("mx-auto p-4 rounded-2xl mb-4 shadow-inner", theme.bgColor, theme.color)}>
                                                    <Icon className="w-8 h-8" />
                                                </div>
                                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{plan.name}</CardTitle>
                                                {plan.subtitle && (
                                                    <div className="mt-1.5">
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#000080]/5 text-[#000080] border border-[#000080]/15">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#000080] animate-pulse" />
                                                            {plan.subtitle}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={cn(
                                                    "text-4xl font-black tracking-tight mt-6",
                                                    isBasic ? "text-[#046A38]" : isBusiness ? "text-[#FF671F]" : "text-[#000080]"
                                                )}>
                                                    {plan.price === 'Free' ? 'FREE' : plan.price?.split('/')[0]}
                                                    {plan.price !== 'Free' && <span className="text-sm text-slate-400 font-bold ml-1">/mo</span>}
                                                </div>
                                                <CardDescription className="pt-4 text-slate-500 font-medium leading-relaxed min-h-[80px] px-2 text-xs">
                                                    {plan.description}
                                                </CardDescription>
                                            </CardHeader>
                                            
                                            <CardContent className="flex-1 mt-4 px-6 md:px-8">
                                                <div className="h-px bg-slate-100 mb-6" />
                                                <ul className="space-y-4">
                                                    {plan.features.map((feature: string, i: number) => (
                                                        <li key={i} className="flex items-start">
                                                            <div className={cn(
                                                                "mt-1 mr-3 p-0.5 rounded-full shrink-0",
                                                                isBasic ? "bg-[#046A38]/10 text-[#046A38]" : isBusiness ? "bg-[#FF671F]/10 text-[#FF671F]" : "bg-[#000080]/10 text-[#000080]"
                                                            )}>
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </div>
                                                            <span className="text-slate-600 text-xs font-semibold leading-tight">{feature}</span>
                                                        </li>
                                                    ))}
                                                    <li className="flex items-start pt-2">
                                                        <div className="mt-1 mr-3 p-0.5 rounded-full bg-blue-50 shrink-0">
                                                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <span className="text-blue-700 text-[10px] font-black uppercase tracking-tighter">
                                                            {isBasic ? 'MINI KYC REQUIRED' : isBusiness ? 'BUSINESS KYC REQUIRED' : 'FULL KYC REQUIRED'}
                                                        </span>
                                                    </li>
                                                </ul>
                                            </CardContent>
     
                                            <CardFooter className="p-6 md:p-8 flex flex-col gap-3">
                                                {isBasic ? (
                                                    <Button 
                                                        className="w-full h-14 text-sm font-black transition-all rounded-2xl shadow-lg active:scale-95 bg-[#046A38] hover:bg-[#03522C] text-white shadow-green-700/20"
                                                        onClick={() => handleSelectPlan(plan)}
                                                        disabled={submitting !== null}
                                                    >
                                                        {submitting === plan.id ? (
                                                            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Selecting...</>
                                                        ) : (
                                                            <>Activate Free Plan <ArrowRight className="ml-2 w-4 h-4" /></>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <div className="w-full flex flex-col gap-3">
                                                        {/* Primary Button based on Device */}
                                                        {isMobile && plan.price_amount > 0 ? (
                                                            <Button
                                                                onClick={() => handleUpiUpgrade(plan)}
                                                                disabled={submitting !== null}
                                                                className={cn(
                                                                    "w-full h-14 rounded-2xl text-white font-black text-sm shadow-xl active:scale-95 transition-all gap-2",
                                                                    isPro ? "bg-[#000080] hover:bg-[#000060] shadow-blue-900/20" : "bg-[#FF671F] hover:bg-orange-600 shadow-orange-600/20"
                                                                )}
                                                            >
                                                                {submitting === plan.id && paymentMode === 'UPI' ? (
                                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Verifying UPI...</>
                                                                ) : (
                                                                    <><Smartphone className="w-4 h-4" /> Instant UPI Upgrade <ArrowRight className="w-4 h-4 ml-auto opacity-50" /></>
                                                                )}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                onClick={() => handleSelectPlan(plan)}
                                                                disabled={submitting !== null}
                                                                className={cn(
                                                                    "w-full h-14 rounded-2xl text-white font-black text-sm shadow-xl active:scale-95 transition-all gap-2",
                                                                    isPro ? "bg-[#000080] hover:bg-[#000060] shadow-blue-900/20" : "bg-[#FF671F] hover:bg-orange-600 shadow-orange-600/20"
                                                                )}
                                                            >
                                                                {submitting === plan.id && paymentMode === 'RZP' ? (
                                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                                                ) : (
                                                                    <><Zap className="w-4 h-4 fill-current" /> Pay with Card / Netbanking <ArrowRight className="w-4 h-4 ml-auto opacity-50" /></>
                                                                )}
                                                            </Button>
                                                        )}

                                                        {/* Secondary Button based on Device */}
                                                        {plan.price_amount > 0 && (
                                                            isMobile ? (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleSelectPlan(plan)}
                                                                    disabled={submitting !== null}
                                                                    className={cn(
                                                                        "w-full h-14 rounded-2xl border-2 font-black text-sm transition-all gap-2",
                                                                        isPro
                                                                            ? "border-[#000080]/20 text-[#000080] hover:bg-[#000080]/5"
                                                                            : "border-[#FF671F]/20 text-[#FF671F] hover:bg-[#FF671F]/5"
                                                                    )}
                                                                >
                                                                    {submitting === plan.id && paymentMode === 'RZP' ? (
                                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                                                                    ) : (
                                                                        <><CreditCard className="w-4 h-4" /> Cards / Netbanking</>
                                                                    )}
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => handleUpiUpgrade(plan)}
                                                                    disabled={submitting !== null}
                                                                    className={cn(
                                                                        "w-full h-14 rounded-2xl border-2 font-black text-sm transition-all gap-2",
                                                                        isPro
                                                                            ? "border-[#000080]/20 text-[#000080] hover:bg-[#000080]/5"
                                                                            : "border-[#FF671F]/20 text-[#FF671F] hover:bg-[#FF671F]/5"
                                                                    )}
                                                                >
                                                                    {submitting === plan.id && paymentMode === 'UPI' ? (
                                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                                                                    ) : (
                                                                        <><Smartphone className="w-4 h-4" /> UPI Upgrade (Mobile Only)</>
                                                                    )}
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </CardFooter>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                    
                    {!plans.length && !loading && (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 space-y-4 max-w-md mx-auto">
                            <AlertCircle className="w-12 h-12 text-amber-500" />
                            <div className="text-center">
                                <h3 className="text-lg font-black text-slate-900 uppercase">No active plans found</h3>
                                <p className="text-slate-500 font-medium">Please check back later or contact support.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
