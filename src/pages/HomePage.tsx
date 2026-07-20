import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Bell, Search, Plus, Send, Zap, 
    Smartphone, Tv, Lightbulb, Play, 
    ChevronRight, CreditCard, Wallet, 
    Trophy,
    ScanLine, ArrowUpRight, ArrowRight, Globe, ShieldAlert,
    Sparkles, TrendingUp, Flame, Gift
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useKYC } from "@/hooks/useKYC";
import { useProfile } from "@/hooks/useProfile";
import { WhatsAppBanner } from "@/components/home/WhatsAppBanner";
import { ServiceGrid } from "@/components/home/ServiceGrid";
import { AnnouncementBar } from "@/components/home/AnnouncementBar";
import { BottomNav } from "@/components/home/BottomNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
    getUserTotalPoints, 
    getUserTotalCashback, 
    getUserStreak, 
    getUserScratchCards,
    checkAndRecordDailyStreak
} from "@/services/rewards.service";
import { Layout } from "@/components/layout/Layout";
import { notificationsService } from "@/services/notifications.service";

const HomePage = () => {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { availableBalance, loading: walletLoading } = useWallet();
    const { isApproved } = useKYC();
    const [scrolled, setScrolled] = useState(false);
    const [totalPoints, setTotalPoints] = useState<number>(0);
    const [pointsLoading, setPointsLoading] = useState(true);
    const [cashback, setCashback] = useState<number>(0);
    const [cashbackLoading, setCashbackLoading] = useState(true);
    const [streak, setStreak] = useState<number>(0);
    const [streakLoading, setStreakLoading] = useState(true);
    const [unscratchedCount, setUnscratchedCount] = useState<number>(0);
    const [unreadCount, setUnreadCount] = useState<number>(0);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        
        const fetchPointsAndRewards = async () => {
            if (user?.id) {
                try {
                    const [points, cb, strk, cards] = await Promise.all([
                        getUserTotalPoints(user.id),
                        getUserTotalCashback(user.id),
                        getUserStreak(user.id),
                        getUserScratchCards(user.id)
                    ]);
                    setTotalPoints(points);
                    setCashback(cb);
                    setStreak(strk);
                    setUnscratchedCount(cards.filter(c => c.status === 'UNLOCKED').length);
                } catch (err) {
                    console.error("Failed to fetch points & rewards:", err);
                } finally {
                    setPointsLoading(false);
                    setCashbackLoading(false);
                    setStreakLoading(false);
                }
            }
        };

        fetchPointsAndRewards();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;
        
        const fetchUnreadCount = async () => {
            const count = await notificationsService.getUnreadCount(user.id);
            setUnreadCount(count);
        };
        
        fetchUnreadCount();
        
        // Listen to custom dismiss/update notifications events
        window.addEventListener('prepe_notifications_updated', fetchUnreadCount);
        return () => {
            window.removeEventListener('prepe_notifications_updated', fetchUnreadCount);
        };
    }, [user?.id]);

    const name = user?.user_metadata?.full_name || "User";
    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    return (
        <Layout showBottomNav={true} hideHeader={true}>
            <div className="relative pb-10 flex flex-col">
                
                {/* Dynamic Background Accents */}
                <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#FF671F]/10 to-transparent pointer-events-none" />
                <div className="absolute top-20 -right-20 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl pointer-events-none" />

                <AnnouncementBar />

                {/* --- Executive Header --- */}
                <header className={cn(
                    "sticky top-0 z-[60] transition-all duration-500 px-5 py-4 flex items-center justify-between",
                    scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-100 shadow-sm py-3" : "bg-transparent"
                )}>
                    <div className="flex items-center gap-3">
                        <Link to="/profile">
                            <Avatar className="h-10 w-10 border-2 border-white shadow-md transition-transform active:scale-95">
                                <AvatarImage src={user?.user_metadata?.avatar_url} />
                                <AvatarFallback className="bg-[#FF671F] text-white font-black text-sm">
                                    {name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#FF671F]">
                                {greeting()}
                            </p>
                            <h1 className="text-sm font-black text-[#000080] tracking-tight">
                                {name.split(' ')[0]}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link to="/notifications" className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 relative active:scale-90 transition-all">
                            <Bell className="w-4 h-4" />
                            {unreadCount > 0 && (
                                <span className="absolute top-3 right-3 w-2 h-2 bg-[#FF671F] rounded-full border-2 border-white" />
                            )}
                        </Link>
                    </div>
                </header>

                <div className="flex-1 px-5 pt-2">
                    {/* --- Premium Wallet Card --- */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative mb-8"
                    >
                        {/* Shadow layers */}
                        <div className="absolute inset-0 bg-[#FF671F]/10 blur-2xl translate-y-4 rounded-[32px]" />
                        
                        <div className="relative bg-gradient-to-br from-[#FF671F] via-white to-[#046A38] rounded-[32px] p-0.5 shadow-xl overflow-hidden group">
                            <div className="bg-white/95 backdrop-blur-xl rounded-[30px] p-6 text-slate-900 h-full border-b-[4px] border-[#046A38]/30">
                                {/* Abstract decorative circles */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF671F]/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform duration-1000 group-hover:scale-150" />
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#046A38]/20 rounded-full -ml-12 -mb-12 blur-xl" />

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-5">
                                        <Link to="/wallet" className="group/balance transition-all active:scale-95">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF671F] mb-1 group-hover/balance:text-[#FF671F]/80 transition-colors">
                                                Available Balance
                                            </p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-bold text-slate-400">₹</span>
                                                <h2 className="text-4xl font-black tracking-tighter text-slate-900 group-hover/balance:text-slate-700 transition-colors">
                                                    {walletLoading ? "..." : (isApproved ? availableBalance.toFixed(2) : "****.**")}
                                                </h2>
                                            </div>
                                        </Link>
                                        <Link 
                                             to="/rewards" 
                                             className="group/rewards relative overflow-hidden bg-gradient-to-br from-amber-500/[0.04] to-yellow-500/[0.02] rounded-2xl p-2 px-3 flex flex-col items-end border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 active:scale-95 select-none"
                                         >
                                             {/* Animated inner glow pulse */}
                                             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-500/5 to-transparent -translate-x-full group-hover/rewards:translate-x-full transition-transform duration-1000 ease-out" />
                                             
                                             {/* Subtle pulsing background glow */}
                                             <div className="absolute -inset-1 bg-amber-400/10 rounded-2xl blur opacity-30 group-hover/rewards:opacity-50 transition-opacity animate-pulse" />

                                             <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider relative z-10">Reward Points</span>
                                             <div className="flex items-center gap-1.5 mt-0.5 relative z-10">
                                                 <motion.div
                                                     animate={{ 
                                                         rotate: [0, 8, -8, 8, 0],
                                                         y: [0, -1.5, 0]
                                                     }}
                                                     transition={{
                                                         repeat: Infinity,
                                                         duration: 3,
                                                         ease: "easeInOut"
                                                     }}
                                                     whileHover={{ scale: 1.2, rotate: 360 }}
                                                 >
                                                     <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500 drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]" />
                                                 </motion.div>
                                                 
                                                 <motion.span 
                                                     key={totalPoints}
                                                     initial={{ scale: 0.8, opacity: 0 }}
                                                     animate={{ scale: 1, opacity: 1 }}
                                                     transition={{ type: "spring", stiffness: 300, damping: 15 }}
                                                     className="text-sm font-black tracking-tight text-[#000080]"
                                                 >
                                                     {pointsLoading ? "..." : totalPoints.toLocaleString()}
                                                 </motion.span>
                                             </div>
                                             
                                             {/* Small animated sparkles floating inside */}
                                             <div className="absolute top-1 left-2 pointer-events-none opacity-0 group-hover/rewards:opacity-100 transition-opacity duration-300">
                                                 <motion.div
                                                     animate={{ 
                                                         scale: [0.6, 1, 0.6],
                                                         opacity: [0.2, 0.8, 0.2],
                                                         rotate: 360 
                                                     }}
                                                     transition={{ repeat: Infinity, duration: 2 }}
                                                 >
                                                     <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                                                 </motion.div>
                                             </div>
                                         </Link>
                                    </div>

                                    {/* Thin Glowing Divider */}
                                    <div className="w-full h-[1px] bg-gradient-to-r from-[#FF671F]/20 via-slate-200 to-[#046A38]/20 my-4" />

                                    {/* Attractive Dynamic Metrics Grid */}
                                    <div className="grid grid-cols-2 gap-3">
                                        
                                        {/* Dynamic Metric 1: Cashback Earned */}
                                        <Link to="/rewards" className="group/metric relative bg-gradient-to-br from-emerald-500/[0.04] to-teal-500/[0.02] border border-emerald-500/10 rounded-2xl p-3 flex flex-col justify-between hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] transition-all duration-300 active:scale-95 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/5 to-transparent -translate-y-full group-hover/metric:translate-y-full transition-transform duration-1000" />
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[8px] font-black tracking-wider text-emerald-600 uppercase">Cashback</span>
                                                <motion.div 
                                                    animate={{ scale: [1, 1.15, 1] }}
                                                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20 group-hover/metric:rotate-45 transition-transform" />
                                                </motion.div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400">Total Earned</p>
                                                <p className="text-base font-black tracking-tight text-emerald-600 group-hover/metric:scale-105 transition-transform origin-left">
                                                    {cashbackLoading ? "..." : `₹${cashback.toFixed(2)}`}
                                                </p>
                                            </div>
                                        </Link>

                                        {/* Dynamic Metric 3: Active Streak */}
                                        <Link to="/rewards/ads" className="group/metric relative bg-gradient-to-br from-orange-500/[0.04] to-amber-500/[0.02] border border-orange-500/10 rounded-2xl p-3 flex flex-col justify-between hover:border-orange-500/30 hover:bg-orange-500/[0.06] transition-all duration-300 active:scale-95 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-orange-500/5 to-transparent -translate-y-full group-hover/metric:translate-y-full transition-transform duration-1000" />
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[8px] font-black tracking-wider text-orange-600 uppercase">Streak</span>
                                                <motion.div
                                                    animate={{ 
                                                        y: [0, -2, 0],
                                                        scaleY: [1, 1.1, 1]
                                                    }}
                                                    transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                                    className="origin-bottom"
                                                >
                                                    <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/25" />
                                                </motion.div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-slate-400">Daily Activity</p>
                                                <p className="text-base font-black tracking-tight text-orange-600 group-hover/metric:scale-105 transition-transform origin-left">
                                                    {streakLoading ? "..." : `${streak} Days`}
                                                </p>
                                            </div>
                                        </Link>

                                    </div>

                                    {/* Unscratched Cards Pulsing Banner (Only shows if user has > 0 unlocked unscratched cards) */}
                                    <AnimatePresence>
                                        {unscratchedCount > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                                animate={{ opacity: 1, height: "auto", marginTop: 14 }}
                                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <Link to="/rewards" className="flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 px-4 animate-pulse hover:animate-none transition-all active:scale-98">
                                                    <div className="flex items-center gap-2">
                                                        <Gift className="w-4 h-4 text-amber-600 animate-bounce" />
                                                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">
                                                            You have {unscratchedCount} Unlocked Scratch Cards!
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center text-[9px] font-black text-amber-800 uppercase tracking-widest gap-0.5">
                                                        Claim <ChevronRight className="w-3 h-3" />
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* --- Dynamic Banners --- */}
                    <div className="mb-8">
                        <WhatsAppBanner />
                    </div>

                    {/* --- Services Section --- */}
                    <motion.section 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-[16px] font-black text-slate-900 tracking-tight">Financial Hub</h3>
                            <Link to="/services" className="text-[11px] font-black text-[#065f46] uppercase tracking-widest flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                                View Full Hub <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                        
                        <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
                             <ServiceGrid />
                        </div>
                    </motion.section>

                    {/* --- Compliance Badges --- */}
                    <div className="pt-6 pb-4 px-4">
                        <div className="flex items-center justify-center gap-6">
                            {[
                                { icon: <Zap className="w-4 h-4" />, label: 'PCI-DSS', color: 'text-amber-500' },
                                { icon: <Globe className="w-4 h-4" />, label: 'ISO 27001', color: 'text-blue-500' },
                                { icon: <ShieldAlert className="w-4 h-4" />, label: 'SECURE', color: 'text-emerald-500' },
                            ].map((badge) => (
                                <div key={badge.label} className="flex items-center gap-1.5 opacity-50 hover:opacity-100 transition-opacity duration-500 cursor-default">
                                    <span className={badge.color}>{badge.icon}</span>
                                    <span className="text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase">{badge.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- Made in India --- */}
                    <div className="py-10 flex flex-col items-center gap-4 select-none">
                        <div className="flex items-center gap-0.5">
                            <div className="w-10 h-[3px] bg-gradient-to-r from-[#FF671F] to-[#FF8C42] rounded-full" />
                            <div className="w-10 h-[3px] bg-gradient-to-r from-slate-200 to-slate-300 rounded-full" />
                            <div className="w-10 h-[3px] bg-gradient-to-r from-[#046A38] to-[#0B8A4B] rounded-full" />
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                                Made in India with <span className="text-red-500 text-xs animate-pulse">❤️</span> Love
                            </p>
                            <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-[0.2em]">
                                Prepe &bull; Your Trusted Payment Partner
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export default HomePage;
