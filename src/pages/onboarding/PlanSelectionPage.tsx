import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CheckCircle2, Loader2, Zap, Landmark, Building2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { adminService } from '@/services/admin';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, ShieldCheck, ArrowRight, Search } from 'lucide-react';
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
        name: 'Basic Free',
        subtitle: 'Digital India Entry 🇮🇳',
        price: 'Free',
        price_amount: 0,
        description: 'Perfect for light users getting started with basic digital utility payments.',
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
        name: 'Pro Premium',
        subtitle: 'Patriotic Power User ⚡',
        price: '₹199/month',
        price_amount: 199,
        is_popular: true,
        description: 'Unlock maximum capabilities with high limits, priority processing, and cashback rewards.',
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
        name: 'Business Elite',
        subtitle: 'Atmanirbhar Vyapaar 🏢',
        price: '₹499/month',
        price_amount: 499,
        description: 'Tailored for retail shops and merchants managing high-volume customer collections.',
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
        case 'PRO': return Zap;
        case 'BUSINESS': return Building2;
        default: return Zap;
    }
};

const getPlanColors = (id: string) => {
    switch (id.toUpperCase()) {
        case 'BASIC': return { color: 'text-[#046A38]', bgColor: 'bg-[#046A38]/5' };
        case 'PRO': return { color: 'text-[#000080]', bgColor: 'bg-[#000080]/5' };
        case 'BUSINESS': return { color: 'text-[#FF671F]', bgColor: 'bg-[#FF671F]/5' };
        default: return { color: 'text-[#000080]', bgColor: 'bg-[#000080]/5' };
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
        try {
            // Check if plan is paid
            if (plan.price_amount && plan.price_amount > 0) {
                const orderData = await paymentService.createRazorpayOrder(plan.price_amount);

                if (!window.Razorpay) {
                    throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
                }

                // 2. Open Razorpay Checkout
                const options = {
                    key: orderData.key,
                    amount: orderData.amount,
                    currency: "INR",
                    name: "Pre-pe India",
                    description: `Plan Upgrade: ${plan.name}`,
                    order_id: orderData.id,
                    handler: async (response: any) => {
                        // 3. Verify Payment
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
                        }
                    },
                    modal: {
                        onblur: () => setSubmitting(null)
                    },
                    prefill: {
                        email: (await supabase.auth.getUser()).data.user?.email || ""
                    },
                    theme: { color: "#2563eb" }
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
                    description: `You've successfully selected the ${planId} plan.`,
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
                <div className="min-h-screen flex items-center justify-center bg-slate-50/50">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        <p className="text-slate-500 font-medium">Loading premium plans...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout hideHeader>
            <div className="min-h-screen pt-12 pb-24 px-4 bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/5 relative">
                {/* Decorative patriotic elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF671F]/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#046A38]/10 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

                <div className="max-w-md mx-auto space-y-8 relative z-10">
                    <div className="text-center space-y-3">
                        <div className="mx-auto w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 ring-8 ring-slate-50">
                            <Smartphone className="w-8 h-8 text-[#FF671F]" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Choose Your Plan</h1>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto font-medium">
                            Pick the right plan that fits your needs. Each plan unlocks different features and requires specific verification. 🇮🇳
                        </p>

                        <div className="max-w-md mx-auto mt-6 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search plans..."
                                className="pl-12 h-12 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-[#FF671F]/20 focus:border-[#FF671F]"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 max-w-md mx-auto w-full px-2">
                        {filteredPlans.map((plan, index) => {
                            const Icon = getPlanIcon(plan.id);
                            const { color, bgColor } = getPlanColors(plan.id);
                            const isBasic = plan.id.toUpperCase() === 'BASIC';
                            const isPro = plan.id.toUpperCase() === 'PRO';
                            const isBusiness = plan.id.toUpperCase() === 'BUSINESS';
                            const isPopular = plan.is_popular || isPro;

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex flex-col w-full h-full"
                                >
                                    <Card className={cn(
                                        "relative w-full flex-1 flex flex-col transition-all duration-500 bg-white/95 backdrop-blur-xl rounded-[32px] overflow-hidden",
                                        isPro 
                                            ? "border-2 border-[#000080]/30 shadow-[0_25px_60px_-15px_rgba(0,0,128,0.15)] md:scale-105 z-10" 
                                            : isBusiness 
                                                ? "border border-[#FF671F]/20 hover:border-[#FF671F]/40 shadow-xl shadow-slate-200/50 hover:shadow-[0_20px_40px_rgba(255,103,31,0.08)]"
                                                : "border border-[#046A38]/20 hover:border-[#046A38]/40 shadow-xl shadow-slate-200/50 hover:shadow-[0_20px_40px_rgba(4,106,56,0.08)]"
                                    )}>
                                        {/* Dynamic Flag Border Strip */}
                                        {isPro ? (
                                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]" />
                                        ) : isBusiness ? (
                                            <div className="absolute top-0 left-0 w-full h-2 bg-[#FF671F]" />
                                        ) : (
                                            <div className="absolute top-0 left-0 w-full h-2 bg-[#046A38]" />
                                        )}
                                        
                                        {isPopular && (
                                            <div className={cn(
                                                "absolute top-4 right-4 text-white px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase shadow-md",
                                                isPro ? "bg-[#000080] shadow-blue-900/10" : isBusiness ? "bg-[#FF671F] shadow-orange-600/10" : "bg-[#046A38]"
                                            )}>
                                                Best Value
                                            </div>
                                        )}
                                        
                                        <CardHeader className="text-center pb-2 relative pt-8">
                                            <div className={cn("mx-auto p-4 rounded-2xl mb-4 shadow-inner", bgColor, color)}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">{plan.name}</CardTitle>
                                            {plan.subtitle && (
                                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{plan.subtitle}</div>
                                            )}
                                            <div className={cn(
                                                "text-4xl font-black tracking-tight mt-6",
                                                isBasic ? "text-[#046A38]" : isBusiness ? "text-[#FF671F]" : "text-[#000080]"
                                            )}>
                                                {plan.price === 'Free' ? 'FREE' : plan.price?.split('/')[0]}
                                                {plan.price !== 'Free' && <span className="text-sm text-slate-400 font-bold ml-1">/mo</span>}
                                            </div>
                                            <CardDescription className="pt-4 text-slate-500 font-medium leading-relaxed min-h-[64px] px-2">
                                                {plan.description}
                                            </CardDescription>
                                        </CardHeader>
                                        
                                        <CardContent className="flex-1 mt-6 px-8">
                                            <div className="h-px bg-slate-100 mb-6" />
                                            <ul className="space-y-4">
                                                {plan.features.map((feature: string, i: number) => (
                                                    <li key={i} className="flex items-start">
                                                        <div className={cn(
                                                            "mt-1 mr-3 p-0.5 rounded-full",
                                                            isBasic ? "bg-[#046A38]/10 text-[#046A38]" : isBusiness ? "bg-[#FF671F]/10 text-[#FF671F]" : "bg-[#000080]/10 text-[#000080]"
                                                        )}>
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </div>
                                                        <span className="text-slate-600 text-sm font-bold leading-tight">{feature}</span>
                                                    </li>
                                                ))}
                                                <li className="flex items-start pt-2">
                                                    <div className="mt-1 mr-3 p-0.5 rounded-full bg-blue-50">
                                                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <span className="text-blue-700 text-xs font-black uppercase tracking-tighter">
                                                        {isBasic ? 'MINI KYC REQUIRED' : isBusiness ? 'BUSINESS KYC REQUIRED' : 'FULL KYC REQUIRED'}
                                                    </span>
                                                </li>
                                            </ul>
                                        </CardContent>
 
                                        <CardFooter className="p-8">
                                            <Button 
                                                className={cn(
                                                    "w-full h-14 text-lg font-black transition-all rounded-2xl shadow-lg active:scale-95",
                                                    isBasic 
                                                        ? "bg-[#046A38] hover:bg-green-700 text-white shadow-green-700/20"
                                                        : isBusiness
                                                            ? "bg-[#FF671F] hover:bg-orange-600 text-white shadow-orange-600/20"
                                                            : "bg-[#000080] hover:bg-[#000060] text-white shadow-blue-900/20"
                                                )}
                                                onClick={() => handleSelectPlan(plan)}
                                                disabled={submitting !== null}
                                            >
                                                {submitting === plan.id ? (
                                                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> {paymentMode === 'RZP' ? 'Initiating...' : 'Selecting...'}</>
                                                ) : (
                                                    <>{isBasic ? 'Start Free' : 'Get Started'} <ArrowRight className="ml-2 w-5 h-5" /></>
                                                )}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                    
                    {!plans.length && !loading && (
                        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50 space-y-4">
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
