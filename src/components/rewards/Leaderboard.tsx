import { useState, useEffect } from "react";
import { getLeaderboard } from "@/services/rewards.service";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Trophy, Medal, Crown, Shield, 
    TrendingUp, User, Layout, ChevronRight,
    Loader2, Star
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LeaderboardUser {
    name: string;
    amount: number;
}

export function Leaderboard() {
    const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaders = async () => {
            const data = await getLeaderboard();
            setLeaders(data as any);
            setLoading(false);
        };
        fetchLeaders();
    }, []);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500 animate-bounce" />;
            case 1: return <Medal className="w-6 h-6 text-slate-300 fill-slate-300" />;
            case 2: return <Medal className="w-6 h-6 text-amber-700 fill-amber-700" />;
            default: return <span className="font-black text-slate-400 text-lg">#{index + 1}</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                    <Star className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500 animate-pulse" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Syncing Elite Performance...</p>
            </div>
        );
    }

    // Showcase top 3 specially
    const topThree = leaders.slice(0, 3);
    const others = leaders.slice(3);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
        >
            {/* Top 3 Podium */}
            <div className="grid grid-cols-3 gap-3 items-end pt-10">
                {/* 2nd Place */}
                {topThree[1] && (
                    <div className="flex flex-col items-center gap-4 order-1 pb-4">
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-1 truncate max-w-[80px] mx-auto">
                                {topThree[1].name}
                            </p>
                            <p className="text-xs font-black text-slate-900 tracking-tight">₹{topThree[1].amount.toLocaleString()}</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-t-3xl h-32 flex flex-col items-center justify-start pt-4 border-x border-t border-slate-200 shadow-inner">
                            {getRankIcon(1)}
                        </div>
                    </div>
                )}

                {/* 1st Place */}
                {topThree[0] && (
                    <div className="flex flex-col items-center gap-4 order-2 pb-4">
                        <div className="text-center">
                             <TrendingUp className="w-4 h-4 text-emerald-500 mx-auto mb-1 animate-pulse" />
                            <p className="text-sm font-black text-slate-900 tracking-tight truncate max-w-[120px] mx-auto">
                                {topThree[0].name}
                            </p>
                            <p className="text-lg font-black text-indigo-600 tracking-tight">₹{topThree[0].amount.toLocaleString()}</p>
                        </div>
                        <div className="w-full bg-gradient-to-b from-indigo-600 to-indigo-800 rounded-t-[3rem] h-48 flex flex-col items-center justify-start pt-6 border-x border-t border-white/20 shadow-2xl relative">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                            {getRankIcon(0)}
                            <div className="mt-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3 text-yellow-300" />
                                <span className="text-[9px] font-black text-white uppercase tracking-widest">King</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3rd Place */}
                {topThree[2] && (
                    <div className="flex flex-col items-center gap-4 order-3 pb-4">
                        <div className="text-center">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-tighter mb-1 truncate max-w-[80px] mx-auto">
                                {topThree[2].name}
                            </p>
                            <p className="text-xs font-black text-slate-900 tracking-tight">₹{topThree[2].amount.toLocaleString()}</p>
                        </div>
                        <div className="w-full bg-amber-50 rounded-t-3xl h-24 flex flex-col items-center justify-start pt-3 border-x border-t border-amber-100 shadow-inner">
                            {getRankIcon(2)}
                        </div>
                    </div>
                )}
            </div>

            {/* Rest of the List */}
            <div className="bg-white/80 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white overflow-hidden ring-1 ring-black/5">
                <div className="flex items-center justify-between mb-8 px-4">
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Top Executive Rankers</h4>
                    <div className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100 flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Top 100</span>
                    </div>
                </div>

                <div className="space-y-1">
                    {others.length === 0 && !topThree.length && (
                        <div className="py-20 text-center">
                            <Medal className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Competition starts now</p>
                        </div>
                    )}
                    
                    {others.map((leader, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-center justify-between p-5 px-6 rounded-3xl hover:bg-slate-50 transition-all group"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-8 flex justify-center">
                                    {getRankIcon(i + 3)}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden relative">
                                        <User className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                                    </div>
                                    <span className="font-bold text-slate-900 tracking-tight leading-none truncate max-w-[120px] md:max-w-none">{leader.name}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <p className="text-base font-black text-slate-900 tracking-tighter">₹{leader.amount.toLocaleString()}</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Recharge</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

const Sparkles = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
);
