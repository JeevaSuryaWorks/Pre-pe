import { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ShieldAlert, LogOut, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminGuard = () => {
    const { user, loading, signOut } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
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

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    if (!AUTHORIZED_ADMINS.includes(user.email || '')) {
        return (
            <div className="min-h-screen relative flex flex-col items-center justify-center p-4 bg-slate-950 text-white overflow-hidden font-sans">
                {/* Soft radial gradient background elements */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF671F]/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#000080]/20 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[150px] pointer-events-none" />

                {/* Premium Glassmorphic Card with Glowing Border */}
                <motion.div 
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="relative w-full max-w-md backdrop-blur-xl bg-slate-900/60 border border-slate-800/80 rounded-[32px] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Subtle inner grid lines or patterns */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

                    {/* Red Saffron Top Accent Light */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 shadow-[0_1px_20px_rgba(239,68,68,0.5)]" />

                    {/* ShieldAlert Glowing Icon Header */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-red-500/20 to-orange-500/10 border border-red-500/30 mb-4 shadow-[0_0_30px_rgba(239,68,68,0.15)] group">
                            <div className="absolute inset-0 rounded-2xl bg-red-500/10 blur-md opacity-75 animate-pulse" />
                            <ShieldAlert className="w-8 h-8 text-red-500 animate-bounce" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-center bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent leading-none py-1">
                            Access Denied
                        </h1>
                        <p className="text-sm font-medium text-slate-400 mt-2 text-center max-w-[280px]">
                            Your account does not have administrator privileges.
                        </p>
                    </div>

                    {/* Authenticated user badge */}
                    <div className="bg-slate-950/80 border border-slate-800/50 rounded-2xl p-4 mb-8 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1.5">Authenticated User</span>
                        <span className="text-sm font-semibold text-slate-200 select-all tracking-tight break-all text-center">
                            {user.email}
                        </span>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="space-y-3 relative z-10">
                        <a 
                            href="/home" 
                            className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-bold text-sm bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Dashboard
                        </a>

                        <button 
                            onClick={handleSignOut}
                            disabled={isLoggingOut}
                            className="flex items-center justify-center gap-2 w-full h-12 rounded-2xl font-bold text-sm bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-300 hover:text-white transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            Sign Out / Switch Account
                        </button>
                    </div>

                    {/* Footer badge */}
                    <div className="mt-8 text-center">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.25em]">
                            PrePe IT Security Desk
                        </span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return <Outlet />;
};
