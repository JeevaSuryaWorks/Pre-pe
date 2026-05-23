import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
    getUserTotalPoints, 
    getUserTotalCashback, 
    getUserStreak, 
    getSpinWheelStatus,
    getUserScratchCards,
    claimScratchCard,
    redeemRewardPoints,
    getAvailableTasks,
    getUserCompletedTasks,
    claimTaskReward,
    addRewardPoints
} from '@/services/rewards.service';
import { 
    Sparkles, 
    Zap, 
    TrendingUp, 
    History, 
    Gift, 
    Award, 
    ChevronRight, 
    Trophy, 
    Timer,
    CalendarDays,
    Banknote,
    Ticket,
    Shield,
    UserIcon,
    Loader2,
    CheckCircle2,
    Star,
    LayoutList,
    ClipboardList,
    Target,
    Wallet,
    Calendar,
    Heart,
    Smartphone,
    ShoppingBag,
    Tag,
    Share2,
    MessageSquare,
    Play,
    Image,
    Lock,
    ShieldCheck,
    Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SpinWheel } from '@/components/gamification/SpinWheel';
import { ScratchCardItem } from '@/components/gamification/ScratchCardList';
import { Leaderboard } from '@/components/rewards/Leaderboard';
import { AdReward } from '@/components/rewards/AdReward';
import { useNavigate } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100
    }
  }
} as const;

export default function RewardsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [totalPoints, setTotalPoints] = useState(0);
  const [cashback, setCashback] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [canSpin, setCanSpin] = useState(false);
  const [remainingSpins, setRemainingSpins] = useState(0);
  const [nextResetTime, setNextResetTime] = useState<string | null>(null);
  const [scratchCards, setScratchCards] = useState<any[]>([]);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [kycLoading, setKycLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [planType, setPlanType] = useState<string>('BASIC');

  const loadData = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    
    try {
      // Record daily check-in activity if none exists today
      await checkAndRecordDailyStreak(user.id);

      const [points, cb, strk, spinStatus, cards, availableTasks, completedIds] = await Promise.all([
        getUserTotalPoints(user.id),
        getUserTotalCashback(user.id),
        getUserStreak(user.id),
        getSpinWheelStatus(user.id),
        getUserScratchCards(user.id),
        getAvailableTasks(),
        getUserCompletedTasks(user.id)
      ]);

      setTotalPoints(points);
      setCashback(cb);
      setStreak(strk);
      setCanSpin(spinStatus.canSpin);
      setRemainingSpins(spinStatus.remainingSpins);
      setNextResetTime(spinStatus.nextResetTime);
      setScratchCards(cards);
      setTasks(availableTasks);
      setCompletedTaskIds(completedIds);

      // Check KYC status from kyc_verifications table
      const { data: kycData } = await (supabase as any)
        .from('kyc_verifications')
        .select('status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setIsApproved(kycData?.status === 'APPROVED');

      // Fetch profile for plan info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile?.plan_type) {
        setPlanType(profile.plan_type.toUpperCase());
      }
    } catch (error) {
      console.error("Error loading rewards data:", error);
    } finally {
      if (!silent) setLoading(false);
      setKycLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleTaskAction = async (task: any) => {
    if (completedTaskIds.includes(task.id)) return;

    // Handle special navigation requirements first
    if (task.requirement_type === 'KYC' && !isApproved) {
        toast({
            title: "Requirement Not Met",
            description: "Please complete your KYC verification first.",
            variant: "destructive"
        });
        navigate(task.target_url || '/profile/kyc');
        return;
    }

    // For validated types (RECHARGE/REFERRAL), we usually navigate to the action page
    if (task.requirement_type === 'RECHARGE' || task.requirement_type === 'REFERRAL') {
        if (task.target_url) {
            navigate(task.target_url);
        } else {
            if (task.requirement_type === 'RECHARGE') navigate('/wallet');
            if (task.requirement_type === 'REFERRAL') navigate('/profile/refer');
        }
        return;
    }

    // Manual/Click type (NONE)
    if (task.requirement_type === 'NONE' || !task.requirement_type) {
        setTaskLoading(true);
        const success = await claimTaskReward(user?.id || '', task);
        setTaskLoading(false);

        if (success) {
            toast({
                title: "Task Completed!",
                description: `You've earned ${task.reward_points} reward points!`,
            });
            loadData(true);
            // If it's a redirect task, go there after claiming
            if (task.target_url) {
                navigate(task.target_url);
            }
        } else {
            toast({
                title: "Claim Failed",
                description: "Something went wrong. Please try again.",
                variant: "destructive"
            });
        }
    }
  };

  const handleSpinComplete = async (points: number) => {
    if (!user) return;
    
    // Even if 0 points, we add a record to track the spin attempt (spins remaining logic depends on ledger)
    const success = await addRewardPoints(
        user.id, 
        points, 
        'SPIN_WHEEL', 
        points > 0 ? `Won ${points} points from Mega Fortune Wheel` : "Better luck next time (0 points won)"
    );

    if (success) {
        toast({
          title: "Wheel Result",
          description: points > 0 ? `Congratulations! You won ${points} points!` : "Better luck next time!",
        });
        loadData(true);
    } else {
        toast({
          title: "Error",
          description: "Failed to record spin result. Please contact support.",
          variant: "destructive"
        });
    }
  };

  const handleScratchComplete = async (id: string, result: any) => {
    const success = await claimScratchCard(user?.id || '', id);
    if (success) {
      toast({
        title: "Reward Claimed!",
        description: result.type === 'REWARD_POINTS' 
          ? `You won ${result.value} points!` 
          : "Cashback added to your wallet.",
      });
      loadData(true);
    }
  };

  const handleRedeem = async () => {
    if (totalPoints < 1000) return;
    
    const pointsToRedeem = Math.floor(totalPoints / 1000) * 1000;
    const cashbackToAdd = (pointsToRedeem / 1000) * 10;

    // Save current state for potential rollback
    const prevPoints = totalPoints;
    const prevCashback = cashback;

    // Optimistic UI updates
    setTotalPoints(prev => prev - pointsToRedeem);
    setCashback(prev => prev + cashbackToAdd);
    setIsRedeeming(true);

    try {
      const result = await redeemRewardPoints(user?.id || '', pointsToRedeem);
      
      if (result.success) {
        toast({
          title: "Redemption Successful!",
          description: `₹${result.amount.toFixed(2)} has been added to your wallet.`,
        });
        // Silent reload to sync any extra server-side changes
        await loadData(true);
      } else {
        // Rollback on logical error from service
        setTotalPoints(prevPoints);
        setCashback(prevCashback);
        toast({
          title: "Redemption Failed",
          description: result.error || "Please try again later.",
          variant: "destructive"
        });
      }
    } catch (error) {
      // Rollback on network/unexpected error
      setTotalPoints(prevPoints);
      setCashback(prevCashback);
      toast({
        title: "Redemption Failed",
        description: "A network error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRedeeming(false);
    }
  };

  const displayCards = scratchCards.length > 0 ? scratchCards : [
    { id: 'demo-1', title: 'Daily Bonus', type: 'REWARD_POINTS', reward_value: 50, status: 'LOCKED', min_recharge_threshold: 100 },
    { id: 'demo-2', title: 'Mega Cashback', type: 'CASHBACK', reward_value: 100, status: 'LOCKED', min_recharge_threshold: 500 }
  ];

  if (loading && !totalPoints) {
    return (
      <Layout showBottomNav>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  const progress = Math.min((totalPoints / 1000) * 100, 100);

  return (
    <Layout title="Rewards" showBottomNav>
      <div className="min-h-screen bg-[#F8FAFC]">
        <div className="max-w-lg mx-auto py-8">
          
          {/* Top Actions */}
          <div className="flex items-center justify-between px-6 mb-6">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl px-4 py-2 font-black uppercase text-[10px] tracking-widest transition-all"
              >
                <Home className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                Home
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/rewards/history')}
                className="group flex items-center gap-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl px-4 py-2 font-black uppercase text-[10px] tracking-widest transition-all"
              >
                <History className="w-4 h-4 transition-transform group-hover:rotate-12" />
                History
              </Button>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative px-6 py-10 rounded-[3rem] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border border-white/10 shadow-3xl text-center overflow-hidden mb-10 mx-4 sm:mx-0"
          >
              {/* Ambient Glowing Orbs */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#FF671F]/15 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#046A38]/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="space-y-6 relative z-10 w-full flex flex-col items-center">
                  <div className="relative w-full flex flex-col items-center">
                      {/* Premium Rewards Badge */}
                      <div className="bg-white/5 px-5 py-1.5 rounded-full backdrop-blur-3xl border border-white/10 flex items-center gap-2 mb-4 mx-auto w-fit shadow-inner">
                          <Trophy className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
                          <span className="tracking-widest uppercase text-[9px] font-black text-slate-200">Rewards Dashboard</span>
                      </div>

                       {/* Glowing Points Display */}
                       <div className="flex flex-col items-center justify-center relative">
                           <div className="flex items-baseline gap-2">
                               <h2 className="text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_4px_12px_rgba(255,255,255,0.15)] font-sans">
                                   {totalPoints.toLocaleString()}
                               </h2>
                               <span className="text-sm text-amber-400 font-black tracking-tight uppercase drop-shadow-md">Points</span>
                           </div>
                       </div>

                       {/* Sleek Custom Progress Bar */}
                       <div className="w-full max-w-xs mx-auto mt-6 space-y-2 px-2">
                           <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400">
                               <span>Goal Progress</span>
                               <span className="text-amber-400 font-black">{Math.floor(progress)}%</span>
                           </div>
                           <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/10 relative p-[2px]">
                               <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${progress}%` }}
                                   transition={{ duration: 1.2, ease: "easeOut" }}
                                   className="h-full bg-gradient-to-r from-[#FF671F] via-[#FFD700] to-[#046A38] rounded-full relative"
                               >
                                   <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[shimmer_1.5s_infinite_linear]" />
                               </motion.div>
                           </div>
                           <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                               <span>0 PTS</span>
                               <span>1,000 PTS Threshold</span>
                           </div>
                       </div>

                      {/* Redeem Action */}
                      <div className="mt-8 flex flex-col items-center gap-4 w-full">
                          <motion.button
                            whileHover={totalPoints >= 1000 ? { scale: 1.04 } : {}}
                            whileTap={totalPoints >= 1000 ? { scale: 0.96 } : {}}
                            onClick={handleRedeem}
                            disabled={totalPoints < 1000 || isRedeeming}
                            className={`
                                relative w-full max-w-xs py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl border
                                ${totalPoints >= 1000 
                                    ? 'bg-gradient-to-r from-[#FF671F] via-orange-500 to-[#FF671F] text-white border-orange-400/40 shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95' 
                                    : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed shadow-none'
                                }
                            `}
                          >
                              {isRedeeming ? (
                                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-white" />
                              ) : (
                                  <div className="flex items-center justify-center gap-2">
                                      <Zap className={totalPoints >= 1000 ? "w-4 h-4 fill-white text-white" : "w-4 h-4 text-slate-500"} />
                                      {totalPoints >= 1000 ? 'Redeem for Wallet' : 'Need 1,000 Pts to Redeem'}
                                  </div>
                              )}
                          </motion.button>
                          
                          {totalPoints >= 1000 && (
                             <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                                Convert to ₹{(Math.floor(totalPoints / 1000) * 10).toFixed(2)} instantly
                             </p>
                          )}
                      </div>
                  </div>

              </div>

              {/* Dynamic Rewards Cards based on plan_type */}
              {(() => {
                const showLeftCashback = planType === 'PRO';
                const leftLabel = showLeftCashback ? 'Cashback' : 'Streak';
                const leftIcon = showLeftCashback ? (
                  <Banknote className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <CalendarDays className="w-3.5 h-3.5 text-orange-300" />
                );
                const leftValue = showLeftCashback ? (
                  `₹${cashback.toFixed(2)}`
                ) : (
                  `${streak}`
                );
                const leftColorClass = showLeftCashback ? 'text-green-400/80' : 'text-orange-300/80';
                const leftUnit = showLeftCashback ? '' : (streak === 1 ? 'Day' : 'Days');

                const showRightStreak = planType === 'PRO';
                const rightLabel = planType === 'BUSINESS' ? 'Commission' : (showRightStreak ? 'Streak' : 'Earned');
                const rightIcon = planType === 'BUSINESS' ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  showRightStreak ? (
                    <CalendarDays className="w-3.5 h-3.5 text-orange-300" />
                  ) : (
                    <Banknote className="w-3.5 h-3.5 text-green-400" />
                  )
                );
                const rightValue = showRightStreak ? (
                  `${streak}`
                ) : (
                  `₹${kycLoading ? "..." : (isApproved ? cashback.toFixed(2) : "**.**")}`
                );
                const rightColorClass = planType === 'BUSINESS' ? 'text-emerald-400/80' : (showRightStreak ? 'text-orange-300/80' : 'text-green-400/80');
                const rightUnit = showRightStreak ? (streak === 1 ? 'Day' : 'Days') : '';

                return (
                  <div className="grid grid-cols-2 gap-3 w-full relative z-10 mt-4">
                        {/* Left Card */}
                        <div className="bg-white/10 hover:bg-white/20 backdrop-blur-3xl rounded-3xl p-4 border border-white/10 transition-all flex flex-col items-center shadow-xl">
                            <div className="flex items-center gap-2 mb-1">
                               {leftIcon}
                               <p className={`text-[8px] font-black uppercase tracking-widest ${leftColorClass}`}>{leftLabel}</p>
                            </div>
                            <p className="text-2xl font-black tabular-nums tracking-tighter text-white">
                              {leftValue} {leftUnit && <span className="text-[8px] font-black text-orange-300/40 uppercase ml-1">{leftUnit}</span>}
                            </p>
                        </div>

                        {/* Right Card */}
                        <div className="bg-white/10 hover:bg-white/20 backdrop-blur-3xl rounded-3xl p-4 border border-white/10 transition-all flex flex-col items-center shadow-xl">
                            <div className="flex items-center gap-2 mb-1">
                               {rightIcon}
                               <p className={`text-[8px] font-black uppercase tracking-widest ${rightColorClass}`}>{rightLabel}</p>
                            </div>
                            <p className="text-2xl font-black tabular-nums tracking-tighter text-white font-mono leading-none pt-1">
                              {rightValue} {rightUnit && <span className="text-[8px] font-black text-orange-300/40 uppercase ml-1">{rightUnit}</span>}
                            </p>
                        </div>
                  </div>
                );
              })()}
          </motion.div>

          {/* Content Sections */}
          <Tabs defaultValue="earn" className="w-full px-4">
               <div className="flex items-center justify-center mb-6">
                 <TabsList className="h-12 bg-white/60 backdrop-blur-xl p-1.5 rounded-full border border-white shadow-xl ring-1 ring-black/5 flex w-full max-w-[400px] gap-1">
                   <TabsTrigger 
                     value="earn" 
                     className="flex-1 flex items-center justify-center gap-1.5 rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-black text-[10px] uppercase tracking-tighter text-slate-500 h-full px-2"
                   >
                     <Sparkles className="w-3.5 h-3.5" />
                     <span className="hidden xs:inline">Points</span>
                     <span className="xs:hidden">Earn</span>
                   </TabsTrigger>
                   <TabsTrigger 
                     value="spin" 
                     className="flex-1 flex items-center justify-center gap-1.5 rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-black text-[10px] uppercase tracking-tighter text-slate-500 h-full px-2"
                   >
                     <Zap className="w-3.5 h-3.5" />
                     <span>Spin</span>
                   </TabsTrigger>
                   <TabsTrigger 
                     value="vouchers" 
                     className="flex-1 flex items-center justify-center gap-1.5 rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-black text-[10px] uppercase tracking-tighter text-slate-500 h-full px-2"
                   >
                     <Ticket className="w-3.5 h-3.5" />
                     <span className="hidden xs:inline">Vouchers</span>
                     <span className="xs:hidden">Gift</span>
                   </TabsTrigger>
                   <TabsTrigger 
                     value="leaderboard" 
                     className="flex-1 flex items-center justify-center gap-1.5 rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-black text-[10px] uppercase tracking-tighter text-slate-500 h-full px-2"
                   >
                     <Award className="w-3.5 h-3.5" />
                     <span className="hidden xs:inline">Rank</span>
                     <span className="xs:hidden">Top</span>
                   </TabsTrigger>
                 </TabsList>
               </div>

             <div className="relative">
               <TabsContent value="earn" className="focus-visible:outline-none">
                   <motion.div 
                     variants={containerVariants}
                     initial="hidden"
                     animate="visible"
                     className="flex flex-col gap-10 px-4 sm:px-0"
                   >
                     {/* Featured Earn: Watch Ad */}
                     {(planType === 'BASIC' || planType === 'FREE') && <AdReward userId={user?.id || ''} onComplete={(p) => loadData(true)} />} 
                        
                        
                     

                     {/* Task Earning List */}
                     <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-3xl rounded-[2.5rem] p-8 space-y-6 border border-white">
                         <div className="flex items-center justify-between mb-4">
                             <h4 className="text-xl font-black tracking-tight text-slate-900">Task Earning</h4>
                             <Sparkles className="w-4 h-4 text-amber-500" />
                         </div>
                         <div className="space-y-4">
                             {tasks.map((task) => {
                                 const TaskIcon = ({
                                     Shield: Shield,
                                     Zap: Zap,
                                     User: UserIcon,
                                     TrendingUp: TrendingUp,
                                     CalendarDays: CalendarDays,
                                     Gift: Gift,
                                     Star: Star,
                                     Award: Award,
                                     Banknote: Banknote,
                                     Target: Target,
                                     Wallet: Wallet,
                                     Calendar: Calendar,
                                     Heart: Heart,
                                     Smartphone: Smartphone,
                                     ShoppingBag: ShoppingBag,
                                     Tag: Tag,
                                     Share2: Share2,
                                     MessageSquare: MessageSquare,
                                     Play: Play,
                                     Image: Image,
                                     Lock: Lock,
                                     ShieldCheck: ShieldCheck,
                                     LayoutList: LayoutList,
                                     ClipboardList: ClipboardList
                                 } as any)[task.icon_name || "Gift"] || Gift;
                                 
                                 const isCompleted = completedTaskIds.includes(task.id);
                                 const statusLabel = isCompleted ? "CLAIMED" : (task.button_text || (task.requirement_type === "NONE" ? "CLAIM" : "GO"));

                                 return (
                                    <div key={task.id} className="flex items-center justify-between p-3 sm:p-4 bg-white/50 rounded-2xl border border-slate-100/50 hover:bg-white transition-all gap-2">
                                        <div className="flex items-center gap-3 sm:gap-4 text-left min-w-0">
                                            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                                <TaskIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs sm:text-sm font-bold text-slate-900 leading-tight truncate">{task.title}</p>
                                                <p className="text-[10px] sm:text-[11px] font-black text-emerald-600 uppercase tracking-widest">+{task.reward_points} PTS</p>
                                            </div>
                                        </div>
                                        <Button 
                                           variant={isCompleted ? "ghost" : "default"} 
                                           size="sm"
                                           disabled={isCompleted || taskLoading}
                                           onClick={() => handleTaskAction(task)}
                                           className={`rounded-full shadow-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest h-7 sm:h-8 px-3 sm:px-4 shrink-0 ${isCompleted ? "text-slate-400" : "bg-slate-900 text-white"}`}
                                        >
                                            {isCompleted && <CheckCircle2 className="w-3 h-3 mr-1" />}
                                            {statusLabel}
                                        </Button>
                                    </div>
                                 );
                             })}
                             {tasks.length === 0 && (
                                <div className="text-center py-6 opacity-40">
                                    <p className="text-xs font-bold">No tasks available right now.</p>
                                </div>
                             )}
                          </div>
                      </Card>

                      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/70 border border-amber-500/30 rounded-[3rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.15),transparent_50%)] pointer-events-none" />
                          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                          
                          <div className="relative z-10 flex flex-col items-center text-center gap-6">
                              <div className="space-y-2">
                                  <div className="mx-auto bg-amber-500/15 border border-amber-500/30 text-amber-400 px-3.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit flex items-center gap-1.5 shadow-inner">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Elite Club Member
                                  </div>
                                  <h3 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-500 drop-shadow-sm mt-2">
                                      Become an Elite Member
                                  </h3>
                                  <p className="text-slate-400 font-medium text-xs leading-relaxed max-w-[280px] mx-auto">
                                      Unlock premium privileges! Get up to <span className="text-amber-400 font-black">2x Rewards Multiplier</span>, exclusive high-yield scratch cards, and VIP digital access.
                                  </p>
                              </div>
                              <Button 
                                  onClick={() => navigate('/upgrade')}
                                  className="w-full bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-black uppercase tracking-widest text-[10px] rounded-2xl h-12 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
                              >
                                  View Executive Plans
                              </Button>
                          </div>
                      </div>
                   </motion.div>
               </TabsContent>

               <TabsContent value="spin" className="focus-visible:outline-none">
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex flex-col items-center"
                 >
                    <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.08)] bg-white/70 backdrop-blur-3xl rounded-[4rem] p-6 sm:p-10 w-full max-w-lg border border-white/50 overflow-hidden">
                       <CardContent className="pt-10 pb-16 flex flex-col items-center">
                           <div className="text-center space-y-4 mb-20">
                              <div className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 shadow-xl shadow-indigo-200 text-white rounded-full text-[10px] font-black uppercase tracking-widest ring-4 ring-indigo-50">
                                 <Sparkles className="w-3 h-3" />
                                 Daily Lucky Spin
                              </div>
                              <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Mega Fortune Wheel</h3>
                              <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                                 Test your luck today! You can win up to <span className="text-indigo-600 font-bold">500 Reward Points</span> or exclusive cash bonuses.
                              </p>
                           </div>
                            <SpinWheel 
                               onSpinComplete={handleSpinComplete} 
                               disabled={!canSpin} 
                               remainingSpins={remainingSpins}
                               nextResetTime={nextResetTime}
                            />
                       </CardContent>
                    </Card>
                 </motion.div>
               </TabsContent>

               <TabsContent value="vouchers" className="focus-visible:outline-none space-y-10">
                  <motion.div
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                  >
                     <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                         <div>
                             <h3 className="text-3xl font-black text-slate-900 tracking-tight">Active Rewards</h3>
                             <p className="text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] xs:max-w-none">Rewards by <span className="text-black font-black italic">Hubble</span> and Pre-pe</p>
                         </div>
                         <div className="text-xs font-black text-indigo-600 px-6 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 uppercase tracking-widest">
                             {displayCards.filter(c => c.status !== 'SCRATCHED').length} Available
                         </div>
                     </div>
                     
                     <motion.div 
                         variants={containerVariants}
                         initial="hidden"
                         animate="visible"
                         className="grid grid-cols-2 gap-4 mt-6"
                     >
                         {displayCards.map((card: any, idx) => (
                             <motion.div key={card.id || `card-${idx}`} variants={itemVariants}>
                                 <ScratchCardItem 
                                     id={card.id}
                                     title={card.title}
                                     type={card.type as any}
                                     value={card.reward_value}
                                     isUnlocked={card.status === 'UNLOCKED'}
                                     status={card.status}
                                     promo_code={card.promo_code}
                                     offer_url={card.offer_url}
                                     onScratchComplete={handleScratchComplete}
                                 />
                             </motion.div>
                         ))}
                     </motion.div>
                  </motion.div>
               </TabsContent>

               <TabsContent value="leaderboard" className="focus-visible:outline-none">
                  <Leaderboard />
               </TabsContent>
             </div>
           </Tabs>
        </div>
      </div>
    </Layout>
  );
}
