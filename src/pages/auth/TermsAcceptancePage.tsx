import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ShieldCheck, Scale, ArrowRight, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { PrePeSpinner } from '@/components/ui/BrandLoader';

export default function TermsAcceptancePage() {
    const navigate = useNavigate();
    const { user, refreshSession } = useAuth();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!acceptTerms || !acceptPrivacy) {
            setError('Please accept both the Terms of Service and Privacy Policy to continue.');
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);

        try {
            // Update auth metadata to store the accepted state securely
            const { error: updateError } = await supabase.auth.updateUser({
                data: { terms_accepted: true }
            });

            if (updateError) throw updateError;

            // Refresh user session locally so route guard knows terms are accepted
            if (refreshSession) {
                await refreshSession();
            }

            toast({
                title: 'Welcome to PrePe! 🇮🇳',
                description: 'Terms accepted successfully. Redirecting you to KYC verification.',
            });

            // If user doesn't have a phone number, complete-profile guard will trigger next.
            // If they already have a phone, redirect directly to KYC page.
            const hasPhone = user.phone || user.user_metadata?.phone;
            if (!hasPhone) {
                navigate('/auth/complete-profile', { replace: true });
            } else {
                navigate('/kyc', { replace: true });
            }

        } catch (err: any) {
            console.error('[TermsAcceptance] Error:', err);
            setError(err.message || 'An unexpected error occurred while saving your choice.');
            toast({
                title: 'Process Failed',
                description: err.message || 'Could not save terms acceptance.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout hideHeader>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/10 relative overflow-hidden">
                {/* Brand Patriotic Glowing Elements */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF671F]/10 rounded-full blur-3xl -mr-40 -mt-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#046A38]/10 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />

                <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-[32px] p-8 md:p-10 shadow-2xl border border-white/20 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                    {/* Tricolor Accent Border Top */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 flex rounded-t-[32px] overflow-hidden">
                        <div className="flex-1 bg-[#FF671F]" />
                        <div className="flex-1 bg-white" />
                        <div className="flex-1 bg-[#046A38]" />
                    </div>

                    <div className="text-center mb-8 pt-4">
                        <div className="w-16 h-16 bg-[#046A38]/10 rounded-2xl flex items-center justify-center mb-6 ring-8 ring-[#046A38]/5 mx-auto">
                            <ShieldCheck className="w-9 h-9 text-[#046A38]" />
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">Accept Terms & Conditions</h1>
                        <p className="text-slate-500 mt-3 text-sm font-semibold leading-relaxed">
                            Welcome back! To keep your transactions completely secure under Indian Digital Payment guidelines, please accept our official policies. 🇮🇳
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            {/* Checkbox 1: Terms of Service */}
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-all cursor-pointer select-none">
                                <Checkbox 
                                    id="accept-terms" 
                                    checked={acceptTerms} 
                                    onCheckedChange={(checked) => setAcceptTerms(!!checked)}
                                    className="mt-1 h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-[#FF671F] data-[state=checked]:border-[#FF671F] transition-all"
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="accept-terms" className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                                        I accept the <Link to="/legal/terms" target="_blank" className="text-[#FF671F] hover:underline font-black">Terms of Service</Link>
                                    </Label>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Governs transaction rules, commission payouts, instant delivery timelines, user behaviour guidelines, and platform ban policies.
                                    </p>
                                </div>
                            </div>

                            {/* Checkbox 2: Privacy Policy */}
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 border border-slate-100 transition-all cursor-pointer select-none">
                                <Checkbox 
                                    id="accept-privacy" 
                                    checked={acceptPrivacy} 
                                    onCheckedChange={(checked) => setAcceptPrivacy(!!checked)}
                                    className="mt-1 h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-[#046A38] data-[state=checked]:border-[#046A38] transition-all"
                                />
                                <div className="space-y-1">
                                    <Label htmlFor="accept-privacy" className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1.5">
                                        I accept the <Link to="/legal/privacy" target="_blank" className="text-[#046A38] hover:underline font-black">Privacy Policy</Link>
                                    </Label>
                                    <p className="text-xs text-slate-500 font-medium">
                                        Outlines how we encrypt your data (PAN/Aadhaar) safely with 256-bit AES standards.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-left">
                                <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                                    ⚠️ {error}
                                </p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-base font-extrabold transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                        >
                            {loading ? (
                                <>
                                    <PrePeSpinner className="h-5 w-5" />
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    Accept & Continue
                                    <ArrowRight className="w-5 h-5 ml-1" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 border-t border-slate-100 pt-6 flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span>PrePe Safe payment environment</span>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
