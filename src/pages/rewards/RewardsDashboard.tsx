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

  const loadData = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    
    try {
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
        .eq('id', user.id)
        .maybeSingle();
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
    
    setIsRedeeming(true);
    const result = await redeemRewardPoints(user?.id || '', Math.floor(totalPoints / 1000) * 1000);
    setIsRedeeming(false);

    if (result.success) {
      toast({
        title: "Redemption Successful!",
        description: `₹${result.amount} has been added to your wallet.`,
      });
      loadData(true);
    } else {
      toast({
        title: "Redemption Failed",
        description: result.error || "Please try again later.",
        variant: "destructive"
      });
    }
  };

  const displayCards = scratchCards.length > 0 ? scratchCards : [
    { id: 'demo-1', title: 'Daily Bonus', type: 'REWARD_POINTS', reward_value: 50, status: 'LOCKED', min_recharge_threshold: 100 },
    { id: 'demo-2', title: 'Mega Cashback', type: 'CASHBACK', reward_value: 100, status: 'LOCKED', min_recharge_threshold: 500 }
  ];

  if (loading && !totalPoints) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Executive Rewards">
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
            className="relative px-6 py-10 rounded-[3rem] bg-slate-900 border border-white/10 shadow-3xl text-center overflow-hidden mb-10"
          >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-emerald-600/10 pointer-events-none"></div>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="space-y-6 relative z-10 w-full max-w-2xl">
                  <div className="relative inline-block">
                      <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                      <div className="bg-white/10 px-5 py-1.5 rounded-full backdrop-blur-3xl border border-white/20 flex items-center gap-2 mb-3 mx-auto w-fit">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="tracking-widest uppercase text-[9px] font-black text-indigo-200">Executive Rewards</span>
                      </div>
                       <div className="flex items-baseline justify-center gap-2 relative">
                           <h2 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl">
                               {totalPoints.toLocaleString()}
                           </h2>
                           <span className="text-sm text-yellow-500 font-black tracking-tight drop-shadow-lg">PTS</span>
                       </div>

                      {/* Redeem Button */}
                      <div className="mt-8 flex flex-col items-center gap-4">
                          <motion.button
                            whileHover={totalPoints >= 1000 ? { scale: 1.05 } : {}}
                            whileTap={totalPoints >= 1000 ? { scale: 0.95 } : {}}
                            onClick={handleRedeem}
                            disabled={totalPoints < 1000 || isRedeeming}
                            className={`
                                relative px-10 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all shadow-2xl
                                ${totalPoints >= 1000 
                                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 shadow-yellow-500/20 hover:shadow-yellow-500/40' 
                                    : 'bg-white/5 text-white/20 border border-white/10 cursor-not-allowed'
                                }
                            `}
                          >
                              {isRedeeming ? (
                                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                              ) : (
                                  <div className="flex items-center gap-2">
                                      <Zap className={totalPoints >= 1000 ? "w-4 h-4 fill-current" : "w-4 h-4"} />
                                      {totalPoints >= 1000 ? 'Redeem for Wallet' : 'Need 1,000 Pts to Redeem'}
                                  </div>
                              )}
                          </motion.button>
                          
                          {totalPoints >= 1000 && (
                             <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest animate-pulse">
                                Convert to ₹{(Math.floor(totalPoints / 1000) * 10).toFixed(2)} instantly
                             </p>
                          )}
                      </div>
                  </div>

              </div>

              <div className="grid grid-cols-2 gap-3 w-full relative z-10 mt-4">
                    {/* Current Streak Card */}
                    <div className="bg-white/10 hover:bg-white/20 backdrop-blur-3xl rounded-3xl p-4 border border-white/10 transition-all flex flex-col items-center shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                           <CalendarDays className="w-3.5 h-3.5 text-indigo-300" />
                           <p className="text-[8px] font-black uppercase tracking-widest text-indigo-300/80">Streak</p>
                        </div>
                        <p className="text-2xl font-black tabular-nums tracking-tighter text-white">
                          {streak} <span className="text-[8px] font-black text-indigo-300/40 uppercase ml-1">{streak === 1 ? 'Day' : 'Days'}</span>
                        </p>
                    </div>

                    {/* Cashback Card */}
                    <div className="bg-white/10 hover:bg-white/20 backdrop-blur-3xl rounded-3xl p-4 border border-white/10 transition-all flex flex-col items-center shadow-xl">
                        <div className="flex items-center gap-2 mb-1">
                           <Banknote className="w-3.5 h-3.5 text-emerald-400" />
                           <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400/80">Earned</p>
                        </div>
                        <p className="text-2xl font-black tabular-nums tracking-tighter text-white font-mono leading-none pt-1">
                          ₹{kycLoading ? "..." : (isApproved ? cashback.toFixed(2) : "**.**")}
                        </p>
                    </div>
              </div>
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
                     <AdReward 
                       userId={user?.id || ''} 
                       onComplete={(p) => loadData(true)} 
                     />

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

                     {/* How to Earn Banner */}
                     <div className="bg-slate-950 rounded-[3rem] p-8 text-white relative overflow-hidden group">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
                         <div className="relative z-10 flex flex-col items-center text-center gap-6">
                             <div className="space-y-2">
                                 <h3 className="text-2xl font-black tracking-tight">Become an Elite Member</h3>
                                 <p className="text-indigo-200/60 font-medium text-xs leading-relaxed max-w-[280px] mx-auto">
                                     Higher plans give you up to <span className="text-indigo-400 font-black">2x Rewards Multiplier</span> and exclusive 
                                     access to high-value scratch cards.
                                 </p>
                             </div>
                             <Button className="w-full bg-white text-slate-950 hover:bg-emerald-50 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-[10px] transition-transform active:scale-95 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]">
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
