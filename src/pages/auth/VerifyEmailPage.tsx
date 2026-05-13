import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const VerifyEmailPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        // If user is logged in and email is verified, redirect
        if (user && user.email_confirmed_at) {
            navigate('/home');
        } else {
            setChecking(false);
        }
    }, [user, navigate]);


    return (
        <Layout hideHeader>
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#FF671F]/5 via-white to-[#046A38]/10 relative overflow-hidden">
                {/* Decorative patriotic elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF671F]/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#046A38]/10 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="max-w-md w-full bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl p-10 text-center animate-in fade-in zoom-in-95 duration-500 border border-white/20">
                    <div className="w-24 h-24 bg-[#FF671F]/10 rounded-full flex items-center justify-center mx-auto mb-8 ring-8 ring-[#FF671F]/5">
                        <Mail className="w-12 h-12 text-[#FF671F]" />
                    </div>

                    <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">Check your email</h1>
                    <p className="text-slate-500 mb-8 font-medium">
                        We've sent a verification link to your email address. Please click the link to confirm your account. 🇮🇳
                    </p>

                    <div className="bg-orange-50 border border-[#FF671F]/10 rounded-2xl p-4 mb-8 text-xs text-orange-900 font-bold leading-relaxed shadow-inner">
                        🇮🇳 OFFICIAL NOTE: Check your Spam folder if you don't see the email in your inbox within a few minutes.
                    </div>

                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full h-12 border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
                            onClick={() => navigate('/login')}
                        >
                            Back to Sign In
                        </Button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default VerifyEmailPage;
