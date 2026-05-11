import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Loader2, Zap, Landmark, Building2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { adminService } from '@/services/admin';
import { supabase } from '@/integrations/supabase/client';
import { Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { paymentService } from '@/services/payment.service';

declare global {
  interface Window {
    Razorpay: any;
  }
}

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
        case 'BASIC': return { color: 'text-slate-600', bgColor: 'bg-slate-100' };
        case 'PRO': return { color: 'text-blue-600', bgColor: 'bg-blue-50' };
        case 'BUSINESS': return { color: 'text-purple-600', bgColor: 'bg-purple-50' };
        default: return { color: 'text-slate-600', bgColor: 'bg-slate-100' };
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
                console.error("Failed to fetch dynamic plans:", err);
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
                            toast({
                                title: "Plan Activated!",
                                description: `Welcome to the ${plan.name} plan.`,
                            });
                            navigate('/onboarding/consent');
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
                navigate('/onboarding/consent');
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
                            .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
                        
                        if (error) throw error;

                        toast({ title: "Plan Activated!", description: `Welcome to the ${plan.name} plan.` });
                        navigate('/onboarding/consent');
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
            <div className="min-h-screen pt-12 pb-24 px-4 bg-slate-50/50">
                <div className="max-w-6xl mx-auto space-y-12">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">Choose Your Plan</h1>
                        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                            Pick the right plan that fits your needs. You can upgrade or downgrade at any time. For a limited time, all selected plans are free to try.
                        </p>
                    </div>

                    <div className="flex flex-col items-center gap-8 max-w-lg mx-auto w-full">
                        {plans.map((plan, index) => {
                            const Icon = getPlanIcon(plan.id);
                            const { color, bgColor } = getPlanColors(plan.id);
                            const isPopular = plan.is_popular;

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Card className={`relative w-full flex flex-col transition-all duration-300 ${isPopular ? 'border-2 border-blue-500 shadow-xl z-10' : 'border border-slate-200 shadow-sm'}`}>
                                        {isPopular && (
                                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase">
                                                Most Popular
                                            </div>
                                        )}
                                        <CardHeader className="text-center pb-2 relative">
                                            <div className={`mx-auto p-4 rounded-2xl mb-4 ${bgColor} ${color} shadow-inner`}>
                                                <Icon className="w-8 h-8" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold tracking-tight">{plan.name}</CardTitle>
                                            {plan.subtitle && (
                                                <div className="text-sm font-medium text-slate-500 mt-1">{plan.subtitle}</div>
                                            )}
                                            <div className="text-3xl font-extrabold tracking-tight mt-4 text-slate-900 break-words">
                                                {plan.price?.replace(/\/ Lifetime/gi, '').trim()}
                                            </div>
                                            <CardDescription className="pt-2 text-slate-500 leading-relaxed min-h-[48px] break-words">
                                                {plan.description}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-1 mt-6">
                                            <ul className="space-y-4">
                                                {plan.features.map((feature: string, i: number) => (
                                                    <li key={i} className="flex items-start">
                                                        <CheckCircle2 className={`w-5 h-5 mr-3 shrink-0 ${isPopular ? 'text-blue-500' : 'text-slate-400'}`} />
                                                        <span className="text-slate-600 text-sm leading-tight">{feature}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </CardContent>
                                        <CardFooter className="pt-6">
                                            <div className="flex flex-col gap-3 w-full">
                                                <Button 
                                                    className={`w-full h-14 text-base font-bold transition-all rounded-2xl ${isPopular ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'}`}
                                                    onClick={() => {
                                                        setPaymentMode('RZP');
                                                        handleSelectPlan(plan);
                                                    }}
                                                    disabled={submitting !== null}
                                                >
                                                    {submitting === plan.id && paymentMode === 'RZP' ? (
                                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                                                    ) : (
                                                        <><Zap className="w-4 h-4 mr-2 fill-current" /> Pay with Card / Netbanking</>
                                                    )}
                                                </Button>

                                                {plan.price_amount > 0 && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => handleUpiUpgrade(plan)}
                                                        disabled={submitting !== null}
                                                        className="w-full h-14 rounded-2xl border-2 border-slate-100 font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 transition-all gap-2"
                                                    >
                                                        {submitting === plan.id && paymentMode === 'UPI' ? (
                                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying UPI...</>
                                                        ) : (
                                                            <><Smartphone className="w-4 h-4" /> Instant UPI Upgrade</>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
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
                                <h3 className="text-lg font-bold text-slate-900">No active plans found</h3>
                                <p className="text-slate-500">Please check back later or contact support.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
