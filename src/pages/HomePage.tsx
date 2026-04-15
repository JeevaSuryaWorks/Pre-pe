import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Bell, Search, Plus, Send, Zap, 
    Smartphone, Tv, Lightbulb, Play, 
    ChevronRight, CreditCard, Wallet, 
    Trophy, ShieldCheck, BadgeCheck,
    ScanLine, ArrowUpRight, ArrowRight
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
import { getUserTotalPoints } from "@/services/rewards.service";
import { Layout } from "@/components/layout/Layout";

const HomePage = () => {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { availableBalance, loading: walletLoading } = useWallet();
    const { isApproved } = useKYC();
    const [scrolled, setScrolled] = useState(false);
    const [totalPoints, setTotalPoints] = useState<number>(0);
    const [pointsLoading, setPointsLoading] = useState(true);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        
        const fetchPoints = async () => {
            if (user?.id) {
                try {
                    const points = await getUserTotalPoints(user.id);
                    setTotalPoints(points);
                } catch (err) {
                    console.error("Failed to fetch points:", err);
                } finally {
                    setPointsLoading(false);
                }
            }
        };

        fetchPoints();
        return () => window.removeEventListener('scroll', handleScroll);
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
                <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#065f46]/10 to-transparent pointer-events-none" />
                <div className="absolute top-20 -right-20 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none" />

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
                                <AvatarFallback className="bg-emerald-600 text-white font-black text-sm">
                                    {name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#065f46] opacity-70">
                                {greeting()}
                            </p>
                            <h1 className="text-sm font-black text-slate-900 tracking-tight">
                                {name.split(' ')[0]}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link to="/notifications" className="h-10 w-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 relative active:scale-90 transition-all">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
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
                        <div className="absolute inset-0 bg-emerald-600/10 blur-2xl translate-y-4 rounded-[32px]" />
                        
                        <div className="relative bg-gradient-to-br from-[#065f46] to-[#047857] rounded-[32px] p-6 text-white shadow-xl overflow-hidden group">
                            {/* Abstract decorative circles */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform duration-1000 group-hover:scale-150" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-400/20 rounded-full -ml-12 -mb-12 blur-xl" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/70 mb-1">
                                            Account Balance
                                        </p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-sm font-bold opacity-80">₹</span>
                                            <h2 className="text-3xl font-black tracking-tighter">
                                                {walletLoading ? "..." : (isApproved ? availableBalance.toFixed(2) : "****.**")}
                                            </h2>
                                        </div>
                                    </div>
                                    <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2 px-3 flex flex-col items-end">
                                        <p className="text-[10px] font-bold text-emerald-100 opacity-80">Reward Points</p>
                                        <div className="flex items-center gap-1">
                                            <Trophy className="w-3 h-3 text-amber-300 fill-amber-300" />
                                            <span className="text-sm font-black tracking-tight">
                                                {pointsLoading ? "..." : totalPoints.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Pillars */}
                                <div className="grid grid-cols-1">
                                    <Link to="/fund-request" className="bg-white/15 hover:bg-white/25 backdrop-blur-md transition-all rounded-2xl py-3 flex flex-col items-center gap-1 group/btn">
                                        <div className="bg-white text-emerald-700 p-1.5 rounded-lg shadow-sm group-hover/btn:scale-110 transition-transform">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-wider">Add Money</span>
                                    </Link>
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

                    {/* --- Bottom Accent --- */}
                    <div className="mt-12 mb-4 bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full -mr-16 -mt-16 blur-3xl opacity-20" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <BadgeCheck className="w-8 h-8 text-emerald-400 mb-3" />
                            <h4 className="text-xl font-black mb-2 tracking-tight">Zero-Trust Payments</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">Your security is our executive priority. Every transaction is encrypted end-to-end.</p>
                            <Link to="/safety" className="w-full">
                                <Button className="mt-6 bg-white text-slate-900 hover:bg-emerald-50 font-black rounded-2xl w-full h-12 shadow-lg shadow-white/10 transition-transform active:scale-95">
                                    Learn About Safety
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* --- Trust Tagline --- */}
                    <div className="py-12 flex flex-col items-center opacity-30 select-none">
                        <div className="h-[1px] w-12 bg-slate-300 mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center italic leading-relaxed">
                            Prepe &bull; Your Trusted Payment Partner
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default HomePage;
