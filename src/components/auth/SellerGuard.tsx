import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ShieldAlert, LogOut, ArrowLeft, Gem } from 'lucide-react';
import { PageLoader, PrePeSpinner } from '@/components/ui/BrandLoader';
import { motion } from 'framer-motion';

export const SellerGuard = () => {
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const navigate = useNavigate();

    if (authLoading || profileLoading) {
        return <PageLoader message="Verifying merchant access..." />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Strictly Authorized Admin Emails
    const AUTHORIZED_ADMINS = [
        'connect.prepe@gmail.com',
        'prepeindia@outlook.com',
        'prepeindia@zohomail.in',
        'jeevasuriya2007@gmail.com'
    ];

    const isAdmin = AUTHORIZED_ADMINS.includes(user.email || '');
    const isBusiness = profile?.plan_type?.toUpperCase() === 'BUSINESS';

    if (isAdmin || isBusiness) {
        return <Outlet />;
    }

    return (
        <div className="min-h-screen relative flex flex-col items-center justify-center p-4 bg-slate-950 text-white overflow-hidden font-sans">
            {/* Soft radial gradient background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF671F]/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#046A38]/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[150px] pointer-events-none" />

            {/* Premium Glassmorphic Card with Glowing Border */}
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-md backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                {/* Subtle inner grid lines or patterns */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                {/* Purple Top Accent Light */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500 shadow-[0_1px_20px_rgba(147,51,234,0.5)]" />

                {/* Glowing Icon Header */}
                <div className="flex flex-col items-center mb-6">
                    <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-purple-500/20 to-indigo-500/10 border border-purple-500/30 mb-4 shadow-[0_0_30px_rgba(147,51,234,0.15)] group">
                        <div className="absolute inset-0 rounded-2xl bg-purple-500/10 blur-md opacity-75 animate-pulse" />
                        <Gem className="w-8 h-8 text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-center bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent leading-none py-1">
                        Business Feature
                    </h1>
                    <p className="text-sm font-medium text-slate-400 mt-3 text-center max-w-[300px] leading-relaxed">
                        Access to the Merchant portal is reserved exclusively for **Business Plan** subscribers. Sell your products and manage inventory instantly.
                    </p>
                </div>

                {/* Authenticated user badge */}
                <div className="bg-slate-950/80 border border-slate-800/50 rounded-2xl p-4 mb-8 flex flex-col items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Your Current Plan</span>
                    <span className="text-base font-black text-amber-500 tracking-wider uppercase">
                        {profile?.plan_type || 'BASIC'} PLAN
                    </span>
                </div>

                {/* Interactive Action Buttons */}
                <div className="space-y-3 relative z-10">
                    <a 
                        href="/upgrade" 
                        className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-black text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all"
                    >
                        <Gem className="w-4 h-4 mr-0.5" />
                        Upgrade to Business Plan
                    </a>

                    <a 
                        href="/home" 
                        className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-bold text-sm bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-350 hover:text-white transition-all active:scale-[0.98]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Return to Dashboard
                    </a>
                </div>

                {/* Footer badge */}
                <div className="mt-8 text-center">
                    <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.25em]">
                        PrePe B2B Merchant Hub
                    </span>
                </div>
            </motion.div>
        </div>
    );
};
