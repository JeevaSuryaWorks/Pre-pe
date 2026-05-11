import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
    CheckCircle2, Loader2, Zap, Landmark, Building2, 
    ChevronRight, Star, ShieldCheck, Crown, ArrowRight, Smartphone, CreditCard
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { adminService } from '@/services/admin';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { paymentService } from '@/services/payment.service';

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
            color: 'text-slate-600', 
            bgColor: 'bg-slate-100', 
            grad: 'from-slate-500/10 to-slate-600/10',
            border: 'border-slate-200'
        };
        case 'PRO': return { 
            color: 'text-blue-600', 
            bgColor: 'bg-blue-100', 
            grad: 'from-blue-600/10 to-indigo-600/10',
            border: 'border-blue-200'
        };
        case 'BUSINESS': return { 
            color: 'text-purple-600', 
            bgColor: 'bg-purple-100', 
            grad: 'from-purple-600/10 to-fuchsia-600/10',
            border: 'border-purple-200'
        };
        default: return { 
            color: 'text-blue-600', 
            bgColor: 'bg-blue-50', 
            grad: 'from-blue-600/5 to-blue-600/5',
            border: 'border-blue-100'
        };
    }
};

export default function UpgradePlans() {
    const navigate = useNavigate();
    const { profile, updateProfile, refreshProfile } = useProfile();
    const { toast } = useToast();
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentMode, setPaymentMode] = useState<'RZP' | 'UPI' | null>(null);
    const [referenceId, setReferenceId] = useState<string | null>(null);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    const currentPlanId = profile?.plan_type?.toLowerCase() || 'basic';

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
                }
            } catch (err) {
                console.error("Failed to fetch plans:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const handleUpgrade = async (plan: any) => {
        if (plan.id.toLowerCase() === currentPlanId) {
            toast({ title: "Current Plan", description: "You are already on this plan." });
            return;
        }

        const planId = plan.id;
        setSubmitting(planId);
        setPaymentMode('RZP');
        try {
            if (plan.price_amount && plan.price_amount > 0) {
                const orderData = await paymentService.createRazorpayOrder(plan.price_amount);

                const options = {
                    key: orderData.key,
                    amount: orderData.amount,
                    currency: "INR",
                    name: "Pre-pe Premium",
                    description: `Upgrade to ${plan.name} Plan`,
                    order_id: orderData.id,
                    handler: async (response: any) => {
                        setSubmitting(planId);
                        try {
                            const verifyData = await paymentService.verifyRazorpay({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            });

                            if (!verifyData || !verifyData.success) {
                                toast({ title: "Payment Error", description: "Verification failed.", variant: "destructive" });
                            } else {
                                toast({ title: "Upgrade Successful!", description: `You are now on the ${plan.name} plan.` });
                                await refreshProfile();
                                navigate('/home');
                            }
                        } catch (error) {
                            toast({ title: "Payment Error", description: "Verification failed.", variant: "destructive" });
                        }
                        setSubmitting(null);
                        setPaymentMode(null);
                    },
                    modal: { onblur: () => { setSubmitting(null); setPaymentMode(null); } },
                    theme: { color: "#2563eb" }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.open();
                return;
            }

            // Free plan update
            const success = await updateProfile({ plan_type: planId });
            if (success) {
                toast({ title: "Plan Updated", description: `Switched to ${plan.name} plan.` });
                navigate('/home');
            }
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
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
            setReferenceId(reference_id);
            
            // Open UPI App
            window.location.href = intent_url;

            // Start Polling
            const interval = setInterval(async () => {
                try {
                    const result = await paymentService.getPaymentStatus(reference_id);
                    if (result.status === 'SUCCESS') {
                        clearInterval(interval);
                        // Complete Upgrade
                        const { error } = await supabase.from('profiles')
                            .update({ plan_type: planId })
                            .eq('user_id', profile?.user_id);
                        
                        if (error) throw error;

                        toast({ title: "Upgrade Successful!", description: `You are now on the ${plan.name} plan.` });
                        await refreshProfile();
                        navigate('/home');
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

    if (loading) {
        return (
            <Layout hideHeader>
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-blue-100 rounded-full animate-pulse" />
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600 absolute inset-0" />
                        </div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Fetching Plans</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout hideHeader showBottomNav>
            <div className="min-h-screen bg-slate-50/50 pb-32">
                {/* Executive Header */}
                <div className="bg-white px-6 pt-12 pb-10 border-b border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-50 rounded-full blur-3xl opacity-50 -ml-32 -mb-32" />
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="bg-blue-600/10 p-3 rounded-2xl mb-4">
                            <Crown className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Upgrade Your Status</h1>
                        <p className="text-slate-500 text-sm font-medium max-w-[280px]">
                            Unlock higher limits, premium rewards, and executive features.
                        </p>
                    </div>
                </div>

                <div className="px-5 mt-8 space-y-6">
                    <AnimatePresence>
                        {plans.map((plan, index) => {
                            const Icon = getPlanIcon(plan.id);
                            const theme = getPlanTheme(plan.id);
                            const isActive = plan.id.toLowerCase() === currentPlanId;
                            const isPopular = plan.is_popular;

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className={cn(
                                        "relative group rounded-[32px] overflow-hidden transition-all duration-500",
                                        isActive ? "ring-2 ring-blue-600 ring-offset-2" : "border border-slate-100"
                                    )}>
                                        {/* Background Gradient */}
                                        <div className={cn("absolute inset-0 bg-gradient-to-br", theme.grad)} />
                                        
                                        <div className="relative bg-white/70 backdrop-blur-xl p-6 shadow-sm">
                                            {isPopular && !isActive && (
                                                <div className="absolute top-4 right-4 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-200">
                                                    Recommended
                                                </div>
                                            )}
                                            {isActive && (
                                                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-200">
                                                    Current Plan
                                                </div>
                                            )}

                                            <div className="flex items-start gap-4 mb-6">
                                                <div className={cn("p-4 rounded-[22px] shadow-inner", theme.bgColor, theme.color)}>
                                                    <Icon className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 leading-none mb-1.5">{plan.name}</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{plan.subtitle}</p>
                                                </div>
                                            </div>

                                            <div className="mb-6">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-3xl font-black text-slate-900">
                                                        {plan.price?.replace(/\/ Lifetime/gi, '').trim()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">{plan.description}</p>
                                            </div>

                                            <div className="space-y-3 mb-8">
                                                {plan.features.map((f: string, i: number) => (
                                                    <div key={i} className="flex items-center gap-3">
                                                        <div className={cn("h-5 w-5 rounded-full flex items-center justify-center shrink-0", isActive ? "bg-emerald-100" : "bg-slate-100")}>
                                                            <CheckCircle2 className={cn("h-3 w-3", isActive ? "text-emerald-600" : "text-slate-400")} />
                                                        </div>
                                                        <span className="text-xs font-semibold text-slate-600">{f}</span>
                                                    </div>
                                                ))}
                                            </div>

                                             <div className="flex flex-col gap-3">
                                                {/* Primary Button based on Device */}
                                                {isMobile && !isActive && plan.price_amount > 0 ? (
                                                    <Button
                                                        onClick={() => handleUpiUpgrade(plan)}
                                                        disabled={submitting !== null}
                                                        className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-emerald-600 text-white font-black text-sm shadow-xl transition-all gap-2"
                                                    >
                                                        {submitting === plan.id && paymentMode === 'UPI' ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin" /> Verifying UPI...</>
                                                        ) : (
                                                            <><Smartphone className="w-4 h-4" /> Instant UPI Upgrade <ArrowRight className="w-4 h-4 ml-auto opacity-50" /></>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleUpgrade(plan)}
                                                        disabled={isActive || submitting !== null}
                                                        className={cn(
                                                            "w-full h-14 rounded-2xl font-black text-sm transition-all duration-300 gap-2",
                                                            isActive 
                                                                ? "bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-none hover:bg-emerald-50"
                                                                : "bg-slate-900 hover:bg-blue-600 text-white shadow-xl hover:shadow-blue-200"
                                                        )}
                                                    >
                                                        {submitting === plan.id && paymentMode === 'RZP' ? (
                                                            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                                        ) : isActive ? (
                                                            <><ShieldCheck className="w-5 h-5" /> Currently Active</>
                                                        ) : (
                                                            <><Zap className="w-4 h-4 fill-current" /> Pay with Card / Netbanking <ArrowRight className="w-4 h-4 ml-auto opacity-50" /></>
                                                        )}
                                                    </Button>
                                                )}

                                                {/* Secondary Button based on Device */}
                                                {!isActive && plan.price_amount > 0 && (
                                                    isMobile ? (
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleUpgrade(plan)}
                                                            disabled={submitting !== null}
                                                            className="w-full h-14 rounded-2xl border-2 border-slate-100 font-black text-sm hover:bg-blue-50 hover:border-blue-200 transition-all gap-2"
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
                                                            className="w-full h-14 rounded-2xl border-2 border-slate-100 font-black text-sm hover:bg-blue-50 hover:border-blue-200 transition-all gap-2"
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
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Footer Note */}
                    <div className="text-center bg-blue-50/50 p-6 rounded-[28px] border border-blue-100/50">
                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-2">
                             Secure Checkout
                        </p>
                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                            Upgrading your plan will immediately enable advanced features. 
                            Payments are processed securely via Razorpay.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
