import { Layout } from '@/components/layout/Layout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, ShieldCheck, Zap, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// Declare custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-wc': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        autoplay?: string | boolean;
        loop?: string | boolean;
        speed?: string | number;
        mode?: string;
        class?: string;
      }, HTMLElement>;
    }
  }
}

const LoginPage = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <Layout hideHeader>
                <div className="container py-8 flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (user) {
        return <Navigate to="/home" replace />;
    }

    return (
        <Layout hideHeader isFullWidth>
            <div className="min-h-screen flex flex-col lg:flex-row bg-[#FAFCFB] relative overflow-hidden">
                {/* Background decorative glows */}
                <div className="absolute top-0 left-0 w-[50vw] h-[50vh] bg-[#FF671F]/5 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[50vw] h-[50vh] bg-[#046A38]/5 rounded-full blur-[120px] pointer-events-none" />

                {/* Left Side: Premium Lottie Hero Section (Visible on LG screens, nicely integrated on mobile) */}
                <div className="flex-1 flex flex-col justify-between p-6 lg:p-12 xl:p-16 bg-gradient-to-b lg:bg-gradient-to-r from-slate-50 to-slate-100/50 border-r border-slate-200/50 relative overflow-hidden">
                    {/* Header/Logo */}
                    <div className="flex items-center gap-3 relative z-10">
                        <img 
                            src="/icon_new.png" 
                            alt="PrePe Logo" 
                            className="h-10 w-10 object-contain shadow-md rounded-xl bg-white p-0.5 border border-slate-100" 
                        />
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                            Pre<span className="text-[#FF671F]">-</span>pe
                        </span>
                        <span className="bg-[#046A38]/10 text-[#046A38] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Pay Securely 🇮🇳
                        </span>
                    </div>

                    {/* Content & Animation Wrapper */}
                    <div className="my-auto py-8 flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg mx-auto lg:mx-0">
                        {/* Lottie Animation using Web Component */}
                        <div className="w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[400px] aspect-video lg:aspect-square mb-6 lg:mb-8 flex items-center justify-center">
                            <dotlottie-wc
                                src="/login-register.lottie"
                                loop="true"
                                autoplay="true"
                                speed="1"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>

                        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            India's Safest Payment <br className="hidden sm:inline" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF671F] to-[#046A38]">
                                Companion
                            </span>
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-slate-500 font-medium leading-relaxed font-sans">
                            Pay all your utility dues, DTH bills, mobile recharges and enjoy daily cashback rewards at just a single click. Safe, secure, and made for India.
                        </p>

                        {/* Value Props Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                            <div className="flex items-center gap-2.5 bg-white/60 backdrop-blur-sm border border-slate-100 p-3 rounded-2xl">
                                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-[#046A38] flex items-center justify-center shrink-0">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-xs font-bold text-slate-800">100% Encrypted</h4>
                                    <p className="text-[10px] text-slate-400">Military-grade protection</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 bg-white/60 backdrop-blur-sm border border-slate-100 p-3 rounded-2xl">
                                <div className="h-8 w-8 rounded-xl bg-orange-50 text-[#FF671F] flex items-center justify-center shrink-0">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-xs font-bold text-slate-800">Instant Settlement</h4>
                                    <p className="text-[10px] text-slate-400">Realtime transactions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer note */}
                    <div className="text-xs text-slate-400 font-medium flex items-center justify-center lg:justify-start gap-1">
                        Made with <Heart className="h-3 w-3 fill-red-500 text-red-500 animate-pulse" /> in India
                    </div>
                </div>

                {/* Right Side: Form Card Section */}
                <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
                    <div className="w-full max-w-md space-y-6">
                        {/* Header for Mobile only (logo & welcome is inside the card on mobile or header) */}
                        <div className="text-center space-y-2 lg:hidden">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
                            <p className="text-sm text-slate-500 font-medium">Sign in to continue your secure payments.</p>
                        </div>

                        <Card className="border border-slate-200/50 shadow-2xl shadow-slate-100/50 bg-white rounded-[32px] overflow-hidden">
                            <CardContent className="p-6 sm:p-8">
                                <div className="hidden lg:block mb-6">
                                    <h3 className="text-xl font-bold text-slate-900">Sign In</h3>
                                    <p className="text-xs text-slate-400 mt-1">Enter your details to access your account</p>
                                </div>
                                <LoginForm />
                            </CardContent>
                        </Card>

                        <p className="text-center text-[11px] text-slate-400 px-4">
                            By continuing, you agree to our{' '}
                            <Link to="/legal/terms" className="underline hover:text-[#FF671F] transition-colors font-semibold">Terms of Service</Link>{' '}
                            and{' '}
                            <Link to="/legal/privacy" className="underline hover:text-[#FF671F] transition-colors font-semibold">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LoginPage;
