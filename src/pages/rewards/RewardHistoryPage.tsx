import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, ChevronLeft, CreditCard, History, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomNav } from '@/components/home/BottomNav';
import { useState, useEffect } from 'react';
import { getPointsHistory, RewardPointsLedger } from '@/services/rewards.service';
import { motion } from 'framer-motion';

const RewardHistoryPage = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState<RewardPointsLedger[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            if (user?.id) {
                const data = await getPointsHistory(user.id);
                setHistory(data);
                setLoading(false);
            }
        };
        loadHistory();
    }, [user?.id]);

    if (authLoading || loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Reward Points History">
            <div className="container py-6 pb-24 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-8">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full bg-white shadow-sm border border-slate-100" 
                        onClick={() => navigate('/rewards')}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Points History</h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rewards Activity</p>
                    </div>
                </div>

                <div className="space-y-3">
                    {history.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-[2rem] border border-dashed border-slate-200">
                            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500">No points activity yet</p>
                        </div>
                    ) : (
                        history.map((tx, idx) => (
                            <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-2xl ${
                                        tx.points > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                    }`}>
                                        {tx.points > 0 ? <TrendingUp className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">{tx.description}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {new Date(tx.created_at).toLocaleDateString(undefined, {
                                                day: 'numeric',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className={`text-sm font-black tabular-nums ${
                                    tx.points > 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                    {tx.points > 0 ? '+' : ''}{tx.points}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
            <BottomNav />
        </Layout>
    );
};

export default RewardHistoryPage;
