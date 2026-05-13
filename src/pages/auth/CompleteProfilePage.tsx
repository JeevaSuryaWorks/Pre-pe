import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Smartphone, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { useKYC } from '@/hooks/useKYC';

export default function CompleteProfilePage() {
    const navigate = useNavigate();
    const { user, refreshSession } = useAuth();
    const { status: kycStatus } = useKYC();
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!phone.trim() || phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        setLoading(true);
        const fullPhone = `+91${phone}`;

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                data: { phone: fullPhone }
            });

            if (updateError) throw updateError;

            // Important: Force the session to refresh so the updated metadata 
            // is reflected locally, satisfying ProtectedRoute conditions
            if (refreshSession) {
                await refreshSession();
            }

            toast({
                title: 'Profile Updated',
                description: 'Phone number added successfully. Proceeding to KYC.',
            });

            // Post-update, redirect to KYC if new or rejected, otherwise home
            const isNeedKYC = kycStatus === null || kycStatus === 'REJECTED';
            navigate(isNeedKYC ? '/kyc' : '/home', { replace: true });

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to update profile');
            toast({
                title: 'Operation Failed',
                description: err.message || 'Could not save your phone number.',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout hideHeader>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/10 relative overflow-hidden">
                {/* Decorative patriotic elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF671F]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#046A38]/10 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-[32px] p-10 shadow-2xl border border-white/20 animate-in fade-in zoom-in-95 duration-500 text-center">
                    <div className="w-20 h-20 bg-[#046A38]/10 rounded-full flex items-center justify-center mb-8 ring-8 ring-[#046A38]/5 mx-auto">
                        <ShieldCheck className="w-10 h-10 text-[#046A38]" />
                    </div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">One Last Step</h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Please provide your phone number to secure your account and proceed to KYC verification. 🇮🇳
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2 text-left">
                            <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-slate-500 ml-1">Mobile Number</Label>
                            <div className="relative group flex items-center">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#FF671F] transition-colors z-10 flex items-center justify-center">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-black text-slate-600 z-10">
                                    +91
                                </div>
                                <Input
                                    id="phone"
                                    placeholder="9876543210"
                                    type="tel"
                                    maxLength={10}
                                    className="pl-20 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:border-[#FF671F] transition-all text-lg font-black tracking-widest"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    disabled={loading}
                                />
                            </div>
                            {error && <p className="text-xs font-bold text-rose-500 mt-2 ml-1 uppercase tracking-tighter">⚠️ {error}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-[#FF671F] hover:bg-orange-600 text-white text-lg font-black transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-orange-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>Proceed to KYC 🇮🇳 <ArrowRight className="ml-2 w-5 h-5" /></>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
