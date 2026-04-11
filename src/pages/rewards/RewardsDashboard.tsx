import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { SpinWheel } from '@/components/gamification/SpinWheel';
import { ScratchCardItem } from '@/components/gamification/ScratchCardList';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Coins, CalendarDays, History } from 'lucide-react';
import { getUserTotalPoints, getPointsHistory, getUserScratchCards, claimScratchCard, addRewardPoints, RewardPointsLedger, ScratchCard } from '@/services/rewards.service';

export default function RewardsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [history, setHistory] = useState<RewardPointsLedger[]>([]);
  const [scratchCards, setScratchCards] = useState<ScratchCard[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [points, hist, cards] = await Promise.all([
        getUserTotalPoints(user.id),
        getPointsHistory(user.id),
        getUserScratchCards(user.id)
      ]);
      setTotalPoints(points);
      setHistory(hist);
      setScratchCards(cards);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSpinComplete = async (points: number) => {
    if (!user || points <= 0) return;
    const success = await addRewardPoints(user.id, points, 'SPIN_WHEEL', 'Won from Daily Spin Wheel');
    if (success) {
      loadData(); // refresh
    }
  };

  const handleScratchComplete = async (id: string, value: number) => {
    if (!user) return;
    const success = await claimScratchCard(user.id, id);
    if (success) {
      toast({
        title: "Reward Claimed!",
        description: `You've successfully claimed your reward of ${value}.`,
      });
      loadData(); // refresh
    } else {
      toast({
        variant: 'destructive',
        title: "Error",
        description: "Could not claim this reward. Please try again.",
      });
    }
  };

  if (loading) {
     return (
        <Layout>
            <div className="flex h-[60vh] flex-col items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-slate-500 font-medium">Loading your rewards...</p>
            </div>
        </Layout>
     );
  }

  // Demo fallback for scratch cards if empty
  const displayCards = scratchCards.length > 0 ? scratchCards : [
      { id: '1', title: 'Welcome Bonus', type: 'REWARD_POINTS', value: 200, status: 'UNLOCKED' as const, isUnlocked: true },
      { id: '2', title: '₹50 Cashback on next DTH', type: 'CASHBACK', value: 50, status: 'LOCKED' as const, isUnlocked: false }
  ];

  return (
    <Layout>
      <div className="container py-8 max-w-5xl space-y-8 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header summary */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-br from-indigo-900 to-violet-800 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500 opacity-20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/3"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                <div className="bg-white/20 p-5 rounded-full backdrop-blur-md shadow-inner border border-white/10">
                    <Coins className="w-12 h-12 text-yellow-400" />
                </div>
                <div>
                    <h2 className="text-slate-200 font-medium text-lg mb-1">Your Total Rewards</h2>
                    <div className="text-5xl font-black tracking-tight">{totalPoints.toLocaleString()} <span className="text-xl text-yellow-400 font-bold ml-1">Pts</span></div>
                </div>
            </div>
            <div className="relative z-10 w-full md:w-auto mt-4 md:mt-0">
                 <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center gap-4">
                     <CalendarDays className="w-8 h-8 text-indigo-300" />
                     <div>
                         <p className="text-sm font-medium text-indigo-200">Daily Streak</p>
                         <p className="text-xl font-bold">1 Day</p>
                     </div>
                 </div>
            </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="spin" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8 bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
            <TabsTrigger value="spin" className="rounded-full rounded-r-none font-semibold">Spin & Win</TabsTrigger>
            <TabsTrigger value="vouchers" className="rounded-full rounded-none font-semibold">Vouchers</TabsTrigger>
            <TabsTrigger value="history" className="rounded-full rounded-l-none font-semibold">History</TabsTrigger>
          </TabsList>

          <TabsContent value="spin" className="focus-visible:outline-none">
             <Card className="border-none shadow-xl bg-white/50 backdrop-blur-xl">
                <CardContent className="pt-10 pb-12 flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2 text-center">Daily Spin & Win</h3>
                    <p className="text-slate-500 text-center max-w-sm mb-12">Spin the wheel every 24 hours to win guaranteed reward points or exclusive cashbacks.</p>
                    <SpinWheel onSpinComplete={handleSpinComplete} />
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="vouchers" className="focus-visible:outline-none space-y-6">
             <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-800">Your Scratch Cards</h3>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {displayCards.map((card: any) => (
                    <ScratchCardItem 
                        key={card.id}
                        id={card.id}
                        title={card.title}
                        type={card.type as any}
                        value={card.value || card.reward_value}
                        isUnlocked={card.isUnlocked ?? card.status === 'UNLOCKED'}
                        onScratchComplete={handleScratchComplete}
                    />
                 ))}
             </div>
          </TabsContent>

          <TabsContent value="history" className="focus-visible:outline-none">
             <Card className="border-none shadow-xl">
                 <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                     <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                         <History className="w-5 h-5" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-800">Points History</h3>
                 </div>
                 <div className="divide-y divide-slate-100">
                     {history.length === 0 ? (
                         <div className="p-8 text-center text-slate-500">No reward points earned yet. Start transacting to earn!</div>
                     ) : history.map((entry) => (
                         <div key={entry.id} className="flex justify-between items-center p-6 hover:bg-slate-50/80 transition-colors">
                             <div>
                                 <p className="font-semibold text-slate-900">{entry.description}</p>
                                 <p className="text-xs text-slate-500 mt-1">{new Date(entry.created_at).toLocaleString()}</p>
                             </div>
                             <div className={`font-bold text-lg ${entry.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {entry.points > 0 ? '+' : ''}{entry.points}
                             </div>
                         </div>
                     ))}
                 </div>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
