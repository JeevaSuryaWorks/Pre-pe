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

export default function CompleteProfilePage() {
    const navigate = useNavigate();
    const { user, refreshSession } = useAuth();
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

            // Post-update, redirect to KYC explicitly
            navigate('/kyc', { replace: true });

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
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner mx-auto">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">One Last Step</h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Please provide your phone number to secure your account and proceed to KYC verification.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Mobile Number</Label>
                            <div className="relative group flex items-center">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors z-10 flex items-center justify-center">
                                    <Smartphone className="w-4 h-4" />
                                </div>
                                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-600 z-10">
                                    +91
                                </div>
                                <Input
                                    id="phone"
                                    placeholder="9876543210"
                                    type="tel"
                                    maxLength={10}
                                    className="pl-20 h-14 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg font-medium tracking-wide"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    disabled={loading}
                                />
                            </div>
                            {error && <p className="text-sm font-medium text-rose-500 mt-2 ml-1">{error}</p>}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-base font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>Proceed to KYC <ArrowRight className="ml-2 w-5 h-5" /></>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
