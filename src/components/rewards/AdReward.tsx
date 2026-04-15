import { useState } from "react";
import { watchAdAndEarnPoints } from "@/services/rewards.service";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Play, X, Loader2, Sparkles, 
    Gift, Timer, Zap, Coins,
    Award, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface AdRewardProps {
    userId: string;
    onComplete: (points: number) => void;
}

export function AdReward({ userId, onComplete }: AdRewardProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [rewarding, setRewarding] = useState(false);
    const { toast } = useToast();

    const startAd = () => {
        setIsPlaying(true);
        setProgress(0);
        
        const duration = 5000; // 5 seconds
        const interval = 50;
        const steps = duration / interval;
        let currentStep = 0;

        const timer = setInterval(() => {
            currentStep++;
            setProgress((currentStep / steps) * 100);

            if (currentStep >= steps) {
                clearInterval(timer);
                completeAd();
            }
        }, interval);
    };

    const completeAd = async () => {
        setRewarding(true);
        try {
            const result = await watchAdAndEarnPoints(userId);
            if (result.success) {
                toast({
                    title: "Reward Earned!",
                    description: `You've earned ${result.points} points for watching the ad.`,
                });
                onComplete(result.points || 5);
                setTimeout(() => {
                    setIsPlaying(false);
                    setRewarding(false);
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setIsPlaying(false);
            setRewarding(false);
        }
    };

    return (
        <>
            <motion.div 
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={startAd}
                className="relative bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 text-white shadow-2xl overflow-hidden cursor-pointer group w-full"
            >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:text-left gap-4 sm:gap-6 text-center sm:text-left">
                    <div className="bg-white/20 backdrop-blur-md p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-white/20 shadow-xl group-hover:rotate-12 transition-transform shrink-0">
                        <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-lg sm:text-xl font-black tracking-tight mb-0.5 sm:mb-2 uppercase tracking-[0.1em] truncate">Watch & Earn</h4>
                        <div className="flex flex-col sm:items-center gap-2">
                            <p className="text-indigo-200 text-[9px] sm:text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-1.5">
                                <Zap className="w-3 h-3 fill-current animate-pulse text-yellow-400" />
                                Earn 5 Points instantly
                            </p>
                            <div className="hidden sm:block w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                <motion.div 
                                    className="h-full bg-emerald-400"
                                    initial={{ width: 0 }}
                                    whileHover={{ width: '40%' }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AnimatePresence>
                {isPlaying && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="w-full max-w-lg space-y-12">
                            <div className="relative h-64 w-full bg-slate-900 rounded-[3rem] border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                                <div className="relative z-10 flex flex-col items-center gap-6">
                                    <div className="relative">
                                        <Loader2 className="w-20 h-20 animate-spin text-indigo-500" />
                                        <Sparkles className="absolute -top-2 -right-2 w-8 h-8 text-yellow-400 animate-pulse" />
                                    </div>
                                    <p className="text-white font-black uppercase tracking-[0.3em] text-xs">Premium Content Playing</p>
                                </div>
                                <div className="absolute bottom-0 left-0 h-1.5 bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-75" style={{ width: `${progress}%` }}></div>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-3xl font-black text-white tracking-tighter">Your Reward is Loading</h2>
                                <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm leading-relaxed">
                                    Do not close this window. Your points will be credited automatically in <span className="text-white font-black">{Math.ceil((5000 - (progress * 50)) / 1000)}s</span>.
                                </p>
                            </div>

                            {rewarding && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center gap-3 text-emerald-400"
                                >
                                    <div className="p-3 bg-emerald-500/20 rounded-full ring-8 ring-emerald-500/5 animate-bounce">
                                        <Coins className="w-8 h-8" />
                                    </div>
                                    <p className="font-black uppercase tracking-widest text-[10px]">Crediting points...</p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
