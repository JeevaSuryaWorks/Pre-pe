import { useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { LoginForm } from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { Loader2, ShieldCheck, Zap, Heart, ChevronDown } from 'lucide-react';
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
    const formSectionRef = useRef<HTMLDivElement>(null);

    const handleScrollToForm = () => {
        formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

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
            {/* Custom high-fidelity styles and animations */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes float-glow-1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    50% { transform: translate(5%, 5%) scale(1.05); }
                }
                @keyframes float-glow-2 {
                    0%, 100% { transform: translate(0, 0) scale(1.05); }
                    50% { transform: translate(-5%, -5%) scale(0.95); }
                }
                @keyframes pulse-ring {
                    0% { transform: scale(0.95); opacity: 0.2; }
                    50% { transform: scale(1.05); opacity: 0.35; }
                    100% { transform: scale(0.95); opacity: 0.2; }
                }
                .animate-float-1 {
                    animation: float-glow-1 8s ease-in-out infinite;
                }
                .animate-float-2 {
                    animation: float-glow-2 10s ease-in-out infinite;
                }
                .animate-pulse-ring {
                    animation: pulse-ring 4s ease-in-out infinite;
                }
                .grid-bg {
                    background-image: linear-gradient(to right, rgba(0,0,0,0.02) 1px, transparent 1px),
                                      linear-gradient(to bottom, rgba(0,0,0,0.02) 1px, transparent 1px);
                    background-size: 3rem 3rem;
                }
            `}} />

            <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50/50 relative overflow-hidden grid-bg">
                {/* Background decorative glows */}
                <div className="absolute top-0 left-0 w-[60vw] h-[60vh] bg-gradient-to-br from-[#FF671F]/8 to-transparent rounded-full blur-[140px] pointer-events-none animate-float-1" />
                <div className="absolute bottom-0 right-0 w-[60vw] h-[60vh] bg-gradient-to-tl from-[#046A38]/8 to-transparent rounded-full blur-[140px] pointer-events-none animate-float-2" />

                {/* Left Side: Premium Lottie Hero Section */}
                <div className="flex-1 flex flex-col justify-between p-6 lg:p-12 xl:p-16 relative overflow-hidden">
                    {/* Header/Logo */}
                    <div className="flex items-center gap-3 relative z-10 transition-transform duration-300 hover:translate-x-1">
                        <img 
                            src="/icon_new.png" 
                            alt="PrePe Logo" 
                            className="h-10 w-10 object-contain shadow-md hover:shadow-lg rounded-xl bg-white p-0.5 border border-slate-100 transition-all duration-300" 
                        />
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                            Pre<span className="text-[#FF671F]">Pe</span>
                        </span>
                        <span className="bg-[#046A38]/10 text-[#046A38] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Pay Securely 🇮🇳
                        </span>
                    </div>

                    {/* Content & Animation Wrapper */}
                    <div className="my-auto py-8 flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg mx-auto lg:mx-0">
                        {/* Lottie Animation using Web Component inside a floating card container */}
                        <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[380px] aspect-video lg:aspect-square mb-8 flex items-center justify-center">
                            {/* Decorative ambient pulsing ring behind the animation */}
                            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-[#FF671F]/5 to-[#046A38]/5 blur-2xl animate-pulse-ring pointer-events-none" />
                            <div className="w-full h-full relative z-10 scale-105 hover:scale-110 transition-transform duration-500 ease-out select-none">
                                <dotlottie-wc
                                    src="/login-register.lottie"
                                    loop="true"
                                    autoplay="true"
                                    speed="1"
                                    style={{ width: '100%', height: '100%' }}
                                />
                            </div>
                        </div>

                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            India's Safest Payment <br className="hidden sm:inline" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF671F] via-[#ff8f59] to-[#046A38]">
                                Companion
                            </span>
                        </h2>
                        <p className="mt-3 text-sm sm:text-base text-slate-500 font-medium leading-relaxed font-sans max-w-md">
                            Pay all your utility dues, DTH bills, mobile recharges and enjoy daily cashback rewards at just a single click. Safe, secure, and made for India.
                        </p>

                        {/* Value Props Grid */}
                        <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                            <div className="flex items-center gap-3 bg-white border border-slate-100/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-300 select-none">
                                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-[#046A38] flex items-center justify-center shrink-0">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-xs font-bold text-slate-800">100% Encrypted</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">Military-grade protection</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-white border border-slate-100/80 p-3.5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.03] transition-all duration-300 select-none">
                                <div className="h-9 w-9 rounded-xl bg-orange-50 text-[#FF671F] flex items-center justify-center shrink-0">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div className="text-left">
                                    <h4 className="text-xs font-bold text-slate-800">Instant Settlement</h4>
                                    <p className="text-[10px] text-slate-400 font-medium">Realtime transactions</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Scroll Down Indicator (Mobile only) & Footer wrapper */}
                    <div className="flex flex-col items-center lg:items-start gap-5 mt-8 lg:mt-0 relative z-20">
                        <button 
                            onClick={handleScrollToForm}
                            className="mx-auto lg:hidden flex items-center gap-2.5 px-6 py-3 rounded-full bg-white border border-slate-200/80 shadow-md hover:shadow-lg active:scale-95 transition-all group"
                        >
                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600 group-hover:text-[#FF671F] transition-colors">
                                Scroll to Sign In
                            </span>
                            <div className="flex items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-[#FF671F]/10 group-hover:text-[#FF671F] transition-colors animate-bounce">
                                <ChevronDown className="h-4 w-4" />
                            </div>
                        </button>

                        <div className="text-xs text-slate-400 font-medium flex items-center justify-center lg:justify-start gap-1 select-none">
                            Made with <Heart className="h-3 w-3 fill-red-500 text-red-500 animate-pulse" /> in India
                        </div>
                    </div>
                </div>

                {/* Right Side: Form Card Section */}
                <div ref={formSectionRef} className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 relative z-10">
                    <div className="w-full max-w-md space-y-6 relative">
                        {/* Decorative background aura behind the card */}
                        <div className="absolute inset-10 rounded-[36px] bg-gradient-to-br from-[#FF671F]/5 to-[#046A38]/5 blur-3xl pointer-events-none" />

                        {/* Header for Mobile only */}
                        <div className="text-center space-y-2 lg:hidden">
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h1>
                            <p className="text-sm text-slate-500 font-medium">Sign in to continue your secure payments.</p>
                        </div>

                        {/* High-fidelity glowing border container wrapping the card */}
                        <div className="relative group/card p-[1.5px] rounded-[34px] bg-gradient-to-b from-slate-200 to-slate-100 hover:from-[#FF671F]/20 hover:to-[#046A38]/20 transition-all duration-500 shadow-2xl shadow-slate-100/70">
                            <Card className="border-none shadow-none bg-white rounded-[32px] overflow-hidden">
                                <CardContent className="p-6 sm:p-8">
                                    <div className="hidden lg:block mb-6">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sign In</h3>
                                        <p className="text-xs text-slate-400 font-medium mt-1">Enter your details to access your account</p>
                                    </div>
                                    <LoginForm />
                                </CardContent>
                            </Card>
                        </div>

                        <p className="text-center text-[11px] text-slate-400 px-4 select-none">
                            By continuing, you agree to our{' '}
                            <Link to="/legal/terms" className="underline hover:text-[#FF671F] transition-colors font-bold">Terms of Service</Link>{' '}
                            and{' '}
                            <Link to="/legal/privacy" className="underline hover:text-[#FF671F] transition-colors font-bold">Privacy Policy</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LoginPage;
