import { useState, useEffect } from "react";
import { 
  getAdWatchStatus, 
  claimAdVideoReward, 
  logAdTelemetry,
  getAdRewardConfig,
  PlatformAdManager
} from "@/services/ad_rewards";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, X, Sparkles, 
  Timer, Zap, Coins, Volume2, VolumeX, AlertTriangle
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
  const [muted, setMuted] = useState(true);
  const [rewarding, setRewarding] = useState(false);
  const [watchedToday, setWatchedToday] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(3);
  const [cooldown, setCooldown] = useState(0);
  const [rewardAmount, setRewardAmount] = useState(5);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const { toast } = useToast();

  // 1. Fetch current status & cooldowns
  const loadStatus = async () => {
    try {
      const status = await getAdWatchStatus(userId);
      const config = await getAdRewardConfig();
      setWatchedToday(status.watchedToday);
      setDailyLimit(status.dailyLimit);
      setCooldown(status.cooldownRemaining);
      setRewardAmount(config.rewardAmount);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [userId, isPlaying]);

  // 2. Active countdown timer logic for cooldowns
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // 3. Launch Ad Handler
  const startAd = async () => {
    if (cooldown > 0) {
      toast({
        title: "Cooldown Active",
        description: `Please wait ${cooldown}s before watching another ad.`,
        variant: "destructive"
      });
      return;
    }

    if (watchedToday >= dailyLimit) {
      toast({
        title: "Limit Reached",
        description: "You have watched all available reward videos for today.",
        variant: "destructive"
      });
      return;
    }

    // Call platform router
    await PlatformAdManager.showRewardedVideo(
      userId,
      () => {
        // ad_started event callback
        setIsPlaying(true);
        setProgress(0);
        triggerWebAdSimulation();
      },
      (earnedPoints) => {
        // ad_completed and rewarded natively
        completeAd(earnedPoints);
      },
      (errorMsg) => {
        // ad_failed
        toast({
          title: "Ad Attempt Failed",
          description: errorMsg,
          variant: "destructive"
        });
        setIsPlaying(false);
      }
    );
  };

  // 4. Web ad playback simulation
  const triggerWebAdSimulation = () => {
    const duration = 6000; // 6 seconds rewarded ad simulation
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      setProgress((currentStep / steps) * 100);

      if (currentStep >= steps) {
        clearInterval(timer);
        setTimeout(() => {
          triggerWebAdClaim();
        }, 300);
      }
    }, interval);
  };

  // 5. Trigger reward claim securely
  const triggerWebAdClaim = async () => {
    setRewarding(true);
    try {
      const result = await claimAdVideoReward(userId);
      if (result.success) {
        completeAd(result.points || 5);
      } else {
        toast({
          title: "Claim Failed",
          description: result.error || "Failed to secure reward.",
          variant: "destructive"
        });
        await logAdTelemetry(userId, 'ad_failed');
        setIsPlaying(false);
        setRewarding(false);
      }
    } catch (e) {
      console.error(e);
      await logAdTelemetry(userId, 'ad_failed');
      setIsPlaying(false);
      setRewarding(false);
    }
  };

  const completeAd = (earnedPoints: number) => {
    toast({
      title: "Reward Earned!",
      description: `Successfully credited +${earnedPoints} points to your ledger!`,
    });
    onComplete(earnedPoints);
    setTimeout(() => {
      setIsPlaying(false);
      setRewarding(false);
      loadStatus();
    }, 1200);
  };

  const cancelAdEarly = async () => {
    await logAdTelemetry(userId, 'ad_failed');
    setIsPlaying(false);
    toast({
      title: "Ad Closed Early",
      description: "You must watch the entire video to claim reward points.",
      variant: "destructive"
    });
  };

  const isLimitReached = watchedToday >= dailyLimit;

  return (
    <>
      <motion.div 
        whileHover={!isLimitReached && cooldown === 0 ? { scale: 1.02, y: -2 } : {}}
        whileTap={!isLimitReached && cooldown === 0 ? { scale: 0.98 } : {}}
        onClick={!isLimitReached && cooldown === 0 ? startAd : undefined}
        className={`relative rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 text-white shadow-2xl overflow-hidden group w-full ${
          isLimitReached 
            ? 'bg-slate-900 border border-slate-800 opacity-60 cursor-not-allowed'
            : cooldown > 0
              ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 cursor-not-allowed'
              : 'bg-gradient-to-br from-indigo-600 to-indigo-800 border border-indigo-500/20 cursor-pointer'
        }`}
      >
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-15"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:text-left gap-4 sm:gap-6 text-center sm:text-left">
          <div className={`p-3 sm:p-4 rounded-2xl sm:rounded-3xl border shadow-xl transition-transform shrink-0 ${
            isLimitReached 
              ? 'bg-slate-850 border-slate-700 text-slate-500'
              : cooldown > 0
                ? 'bg-slate-750 border-slate-600 text-slate-400'
                : 'bg-white/20 border-white/20 text-white group-hover:rotate-12'
          }`}>
            {cooldown > 0 ? (
              <Timer className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
            ) : (
              <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="text-lg sm:text-xl font-black tracking-tight mb-0.5 sm:mb-2 uppercase tracking-[0.1em] truncate">
              {isLimitReached ? 'Ad Limit Reached' : cooldown > 0 ? 'Video Cooldown' : 'Watch & Earn'}
            </h4>
            <div className="flex flex-col sm:items-start gap-2">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 justify-center sm:justify-start">
                <Zap className="w-3 h-3 fill-current animate-pulse text-yellow-400" />
                {cooldown > 0 
                  ? `Wait ${cooldown}s before next video` 
                  : isLimitReached 
                    ? `Watched ${watchedToday}/${dailyLimit} today` 
                    : `Earn ${rewardAmount} Points Instantly`
                }
              </p>
              {!isLimitReached && cooldown === 0 && (
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1 max-w-[150px] mx-auto sm:mx-0">
                  <motion.div 
                    className="h-full bg-emerald-400"
                    initial={{ width: 0 }}
                    whileHover={{ width: '100%' }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 bg-slate-950/40 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">TODAY</span>
            <span className="text-sm font-black mt-0.5">{watchedToday} / {dailyLimit}</span>
          </div>
        </div>
      </motion.div>

      {/* Full-screen Simulated Interactive Player Overlay */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 text-center"
          >
            <div className="w-full max-w-md space-y-8 relative">
              {/* Early Close Button */}
              <button 
                onClick={cancelAdEarly}
                className="absolute -top-12 right-0 h-10 w-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Video Player Box Mockup */}
              <div className="relative aspect-video w-full bg-slate-900 rounded-[2rem] border border-white/10 flex items-center justify-center overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-500">
                {/* Real Video Commercial Stream */}
                <video
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                  autoPlay
                  playsInline
                  muted={muted}
                  controls={false}
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />

                {/* Overlay layer for visual premium text branding */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/30 z-10 pointer-events-none" />

                <div className="absolute bottom-4 left-4 z-20 text-left pointer-events-none">
                  <p className="text-white font-black uppercase tracking-[0.2em] text-[9px] drop-shadow-md">PREMIUM SPONSOR CONTENT</p>
                  <p className="text-slate-200 text-[8px] font-bold uppercase tracking-widest flex items-center gap-1 drop-shadow-md">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400 fill-current" /> Pre-pe Monetization Loop
                  </p>
                </div>

                {/* Progress bar overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-950/40">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-75" 
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Video controls */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
                  <span className="px-2 py-0.5 bg-slate-950/60 rounded-md text-[8px] font-black tracking-widest border border-white/5">
                    AD
                  </span>
                  <button 
                    onClick={() => setMuted(!muted)}
                    className="p-1.5 bg-slate-950/60 rounded-full border border-white/5"
                  >
                    {muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Status Header */}
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
                  {rewarding ? (
                    <>Securing Reward <Sparkles className="w-5 h-5 text-amber-400 animate-bounce" /></>
                  ) : (
                    <>Watching Video Ad</>
                  )}
                </h3>
                <p className="text-slate-400 font-medium max-w-xs mx-auto text-xs leading-relaxed">
                  {rewarding ? (
                    <span className="text-emerald-400 font-bold uppercase tracking-widest">Adding reward points to wallet ledger...</span>
                  ) : (
                    <>Do not close this panel to ensure reward completion. Crediting in <span className="text-white font-black">{Math.ceil((6000 - (progress * 60)) / 1000)}s</span>.</>
                  )}
                </p>
              </div>

              {/* Warning label */}
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-left">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-400/90 font-semibold leading-relaxed">
                  Closing early cancels the transaction, which resets point distribution. Let the video finish completely.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
