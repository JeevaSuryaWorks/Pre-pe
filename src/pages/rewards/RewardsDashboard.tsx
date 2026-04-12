import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { SpinWheel } from '@/components/gamification/SpinWheel';
import { ScratchCardItem } from '@/components/gamification/ScratchCardList';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Coins, CalendarDays, History, TrendingUp, Award, Sparkles, Zap, Ticket, Banknote } from 'lucide-react';
import { useKYC } from '@/hooks/useKYC';
import { 
  getUserTotalPoints, 
  getPointsHistory, 
  getUserScratchCards, 
  claimScratchCard, 
  addRewardPoints, 
  canUserSpinToday,
  initializeWelcomeCard,
  getUserStreak,
  getLastSpinTimestamp,
  RewardPointsLedger, 
  ScratchCard 
} from '@/services/rewards.service';

export default function RewardsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [history, setHistory] = useState<RewardPointsLedger[]>([]);
  const [scratchCards, setScratchCards] = useState<ScratchCard[]>([]);
  const [canSpin, setCanSpin] = useState<boolean>(true);
  const [lastSpinTime, setLastSpinTime] = useState<string | null>(null);
  const [streak, setStreak] = useState<number>(1);
  const [cashback, setCashback] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { isApproved, isLoading: kycLoading } = useKYC();

  const loadData = async (isRefresh = false) => {
    if (!user) return;
    if (!isRefresh) setLoading(true);
    
    try {
      // Ensure welcome card exists for the user
      await initializeWelcomeCard(user.id);

      const [points, hist, cards, daySpin, currentStreak, lastTime] = await Promise.all([
        getUserTotalPoints(user.id),
        getPointsHistory(user.id),
        getUserScratchCards(user.id),
        canUserSpinToday(user.id),
        getUserStreak(user.id),
        getLastSpinTimestamp(user.id)
      ]);
      setTotalPoints(points);
      setHistory(hist);
      setScratchCards(cards);
      setCanSpin(daySpin);
      setStreak(currentStreak);
      setLastSpinTime(lastTime);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSpinComplete = async (points: number) => {
    if (!user || points <= 0) return;
    const success = await addRewardPoints(user.id, points, 'SPIN_WHEEL', 'Won from Daily Spin Wheel');
    if (success) {
      setCanSpin(false); 
      loadData(true); // refresh points and history
    }
  };

  const handleScratchComplete = async (id: string, value: number) => {
    if (!user) return;
    
    // Prevent database calls for demo cards
    if (id.startsWith('demo-')) {
      return;
    }

    const success = await claimScratchCard(user.id, id);
    if (success) {
      loadData(true); // refresh
    } else {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Could not claim this reward. Please try again.",
      });
    }
  };

  if (isInitialLoading) {
     return (
        <Layout showBottomNav={true}>
            <div className="flex h-[60vh] flex-col items-center justify-center">
                <div className="relative">
                    <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mb-4" />
                    <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-pulse" />
                </div>
                <p className="text-slate-500 font-bold tracking-widest uppercase text-xs animate-pulse">Initializing Premium Rewards...</p>
            </div>
        </Layout>
     );
  }

  // Filter out cards that are already scratched
  const activeCards = scratchCards.filter(c => c.status !== 'SCRATCHED');

  // Fallback to demo cards only if user truly has NO cards after initialization
  const displayCards = activeCards.length > 0 ? activeCards : (
      scratchCards.length === 0 ? [
          { id: 'demo-1', title: 'Welcome Bonus', type: 'REWARD_POINTS' as const, reward_value: 200, status: 'UNLOCKED' as const, description: 'Preview of our welcome reward' },
          { id: 'demo-2', title: 'Big Cashback Offer', type: 'CASHBACK' as const, reward_value: 50, status: 'LOCKED' as const, description: 'Unlock this by recharging' }
      ] : []
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <Layout showBottomNav={true}>
      <div className="relative min-h-screen bg-slate-50/50 pb-20">
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-violet-200/40 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="container relative z-10 py-10 max-w-6xl space-y-12">
          
          {/* Main Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative flex flex-col items-center justify-between gap-8 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 px-8 py-12 rounded-[3.5rem] text-white shadow-[0_40px_80px_rgba(0,0,0,0.3)] border border-white/5 overflow-hidden text-center"
          >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] transform translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="space-y-6 relative z-10 w-full max-w-2xl">
                  <div className="relative inline-block">
                      <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                      <div className="bg-white/10 px-5 py-1.5 rounded-full backdrop-blur-3xl border border-white/20 flex items-center gap-2 mb-3 mx-auto w-fit">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="tracking-widest uppercase text-[9px] font-black text-indigo-200">Executive Rewards</span>
                      </div>
                      <div className="flex items-baseline justify-center gap-3">
                          <h2 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl">
                              {totalPoints.toLocaleString()}
                          </h2>
                          <span className="text-xl text-yellow-500 font-black tracking-tight drop-shadow-lg">PTS</span>
                      </div>
                  </div>

              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 w-full relative z-10">
                    {/* Current Streak Card */}
                    <div className="bg-white/10 hover:bg-white/20 backdrop-blur-3xl rounded-[2rem] p-6 px-10 border border-white/10 transition-all group/card flex flex-col items-center min-w-[200px] shadow-2xl">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                              <CalendarDays className="w-5 h-5 text-indigo-300" />
                           </div>
                           <p className="text-[9px] font-black uppercase tracking-[0.25em] text-indigo-300/80">Current Streak</p>
                        </div>
                        <p className="text-4xl font-black tabular-nums tracking-tighter text-white">
                          {streak} <span className="text-[9px] font-black text-indigo-300/40 uppercase tracking-widest ml-1">{streak === 1 ? 'Day' : 'Days'}</span>
                        </p>
                    </div>

                    {/* Cashback Card */}
                    <div className="bg-white/10 hover:bg-white/20 backdrop-blur-3xl rounded-[2rem] p-6 px-10 border border-white/10 transition-all group/card flex flex-col items-center min-w-[200px] shadow-2xl">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                              <Banknote className="w-5 h-5 text-emerald-400" />
                           </div>
                           <p className="text-[9px] font-black uppercase tracking-[0.25em] text-emerald-400/80">Cashback Earned</p>
                        </div>
                        <p className="text-4xl font-black tabular-nums tracking-tighter text-white font-mono">
                          ₹{kycLoading ? "..." : (isApproved ? cashback.toFixed(2) : "**.**")}
                        </p>
                    </div>
              </div>
          </motion.div>

          {/* Content Sections */}
          <Tabs defaultValue="spin" className="w-full">
            <div className="flex items-center justify-center mb-14 px-4">
                <TabsList className="h-16 bg-white/60 backdrop-blur-3xl p-1.5 rounded-full border border-white shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden ring-1 ring-black/5 w-full max-w-lg grid grid-cols-3 relative">
                  <TabsTrigger 
                    value="spin" 
                    className="flex items-center justify-center gap-2 rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black text-[10px] uppercase tracking-wider text-slate-500 py-3 px-2 h-full"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Daily Spin</span>
                    <span className="xs:hidden">Spin</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="vouchers" 
                    className="flex items-center justify-center gap-2 rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black text-[10px] uppercase tracking-wider text-slate-500 py-3 px-2 h-full"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span className="hidden xs:inline">Scratch Cards</span>
                    <span className="xs:hidden">Cards</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="history" 
                    className="flex items-center justify-center gap-2 rounded-full data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-xl transition-all font-black text-[10px] uppercase tracking-wider text-slate-500 py-3 px-2 h-full"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>History</span>
                  </TabsTrigger>
                </TabsList>
            </div>

            <div className="relative">
              <TabsContent value="spin" className="focus-visible:outline-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center"
                >
                   <Card className="border-none shadow-[0_40px_100px_rgba(0,0,0,0.08)] bg-white/70 backdrop-blur-3xl rounded-[4rem] p-10 w-full max-w-4xl border border-white/50">
                      <CardContent className="pt-10 pb-16 flex flex-col items-center">
                          <div className="text-center space-y-4 mb-20">
                             <div className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 shadow-xl shadow-indigo-200 text-white rounded-full text-[10px] font-black uppercase tracking-widest ring-4 ring-indigo-50">
                                <Sparkles className="w-3 h-3" />
                                1x Spin per day
                             </div>
                             <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Mega Fortune Wheel</h3>
                             <p className="text-slate-500 max-w-md mx-auto font-medium leading-relaxed">
                                Test your luck today! You can win up to <span className="text-indigo-600 font-bold">500 Reward Points</span> or exclusive cash bonuses.
                             </p>
                          </div>
                           <SpinWheel 
                              onSpinComplete={handleSpinComplete} 
                              disabled={!canSpin} 
                              lastSpinTime={lastSpinTime}
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
                            <p className="text-slate-500 font-medium">Rewards by <span className="text-black font-black italic">Hubble</span> and Pre-pe</p>
                        </div>
                        <div className="text-xs font-black text-indigo-600 px-6 py-2 bg-indigo-50 rounded-2xl border border-indigo-100 uppercase tracking-widest">
                            {displayCards.filter(c => c.status !== 'SCRATCHED').length} Available
                        </div>
                    </div>
                    
                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10 mt-10"
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

              <TabsContent value="history" className="focus-visible:outline-none">
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                 >
                    <Card className="border-none shadow-2xl bg-white/70 backdrop-blur-3xl rounded-[3.5rem] overflow-hidden border border-white/50">
                        <div className="p-10 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-5">
                                <div className="bg-slate-950 p-4 rounded-3xl text-white shadow-2xl">
                                    <History className="w-8 h-8" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Points Ledger</h3>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Real-time update</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-2">
                            {history.length === 0 ? (
                                <div className="py-32 text-center">
                                    <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                        <Coins className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Your ledger is currently empty</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                  {history.map((entry, idx) => (
                                      <motion.div 
                                        key={entry.id || `hist-${idx}`} 
                                        whileHover={{ scale: 0.99, backgroundColor: 'rgba(255,255,255,0.8)' }}
                                        className="flex justify-between items-center p-8 rounded-[2.5rem] transition-all"
                                      >
                                          <div className="flex items-center gap-6 text-left">
                                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${entry.points > 0 ? 'bg-emerald-50 text-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-rose-50 text-rose-600 shadow-[0_0_20px_rgba(244,63,94,0.1)]'}`}>
                                                  {entry.points > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingUp className="w-6 h-6 rotate-180" />}
                                              </div>
                                              <div>
                                                  <p className="font-black text-slate-900 text-xl leading-none mb-2">{entry.description}</p>
                                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(entry.created_at).toLocaleString()}</p>
                                              </div>
                                          </div>
                                          <div className={`text-3xl font-black tabular-nums tracking-tighter ${entry.points > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                              {entry.points > 0 ? '+' : ''}{entry.points}
                                          </div>
                                      </motion.div>
                                  ))}
                                </div>
                            )}
                        </div>
                    </Card>
                 </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
