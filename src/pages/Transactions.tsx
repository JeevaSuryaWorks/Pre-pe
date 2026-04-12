import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  History, 
  Wallet, 
  FileBarChart, 
  ChevronRight, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { getTransactionHistory } from '@/services/recharge.service';
import { motion } from 'framer-motion';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip,
  Cell
} from 'recharts';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from '@/components/ui/chart';

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({ count: 0, growth: 12 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      if (user) {
        const txns = await getTransactionHistory(user.id, 100);
        const successCount = txns.filter(t => t.status === 'SUCCESS').length;
        setStats(prev => ({ ...prev, count: successCount }));

        // Mock chart data for a 7-day trend
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const mockData = days.map(day => ({
          name: day,
          total: Math.floor(Math.random() * 500) + 100
        }));
        setChartData(mockData);
      }
    };
    loadStats();
  }, [user]);

  const chartConfig = {
    total: {
      label: "Transaction Volume",
      color: "hsl(var(--primary))",
    },
  };

  const reportModules = [
    {
      title: "Transaction History",
      description: "Mobile recharges, DTH, and bill payment detailed records.",
      icon: History,
      color: "bg-indigo-50 text-indigo-600",
      iconColor: "text-indigo-600",
      path: "/reports/history"
    },
    {
      title: "Wallet Ledger",
      description: "Chronological track of credits, debits, and lock/unlocks.",
      icon: Wallet,
      color: "bg-emerald-50 text-emerald-600",
      iconColor: "text-emerald-600",
      path: "/wallet/ledger"
    },
    {
      title: "Account Statement",
      description: "Generate and download professional monthly PDF statements.",
      icon: FileBarChart,
      color: "bg-purple-50 text-purple-600",
      iconColor: "text-purple-600",
      path: "/wallet/ledger",
    }
  ];

  return (
    <Layout title="Reports" showBottomNav>
      <div className="container py-8 pb-32 max-w-5xl space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-1"
          >
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Reports & Analytics</h1>
            <p className="text-slate-500 font-medium">Insights into your financial mobility and activity.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100"
          >
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">Live Analytics</span>
          </motion.div>
        </div>

        {/* Bento Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1"
          >
            <Card className="h-full bg-slate-950 text-white rounded-[2.5rem] border-none shadow-2xl overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/30 transition-all"></div>
              <CardContent className="p-8 flex flex-col justify-between h-full relative z-10">
                <div className="space-y-4">
                  <div className="inline-flex p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Total Success</p>
                    <h3 className="text-6xl font-black tracking-tighter mt-1">{stats.count}</h3>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center gap-2 text-emerald-400">
                  <div className="bg-emerald-400/10 p-1 rounded-full">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold">+{stats.growth}% vs last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Visualization Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2"
          >
            <Card className="h-full bg-white rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
               <CardContent className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Transaction Volume</h4>
                      <p className="text-slate-400 text-[10px] font-medium uppercase tracking-tight">Last 7 Days trend</p>
                    </div>
                  </div>
                  
                  <div className="h-[180px] w-full">
                    <ChartContainer config={chartConfig}>
                      <BarChart data={chartData}>
                        <XAxis 
                          dataKey="name" 
                          stroke="#94a3b8" 
                          fontSize={10} 
                          tickLine={false} 
                          axisLine={false} 
                          fontWeight={700}
                        />
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Bar 
                          dataKey="total" 
                          fill="currentColor" 
                          radius={[6, 6, 0, 0]}
                          className="fill-indigo-600"
                        >
                          {chartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fillOpacity={0.8 + (index * 0.03)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
               </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Modules Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse"></span>
              Strategic Deep Dives
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reportModules.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + (index * 0.1) }}
                onClick={() => navigate(item.path)}
                className="group relative bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all cursor-pointer active:scale-95"
              >
                <div className={`p-4 rounded-2xl ${item.color} w-fit mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <item.icon className={`h-7 w-7 ${item.iconColor}`} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed pr-6">
                  {item.description}
                </p>
                
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                  <div className="bg-indigo-600 p-2 rounded-full shadow-lg">
                    <ChevronRight className="h-4 w-4 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Suggestion */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-indigo-600/5 border border-indigo-100 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              <Download className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-black text-slate-900 uppercase text-xs tracking-wider">Statement Ready</p>
              <p className="text-slate-500 text-xs font-medium mt-0.5">Your monthly consolidated report is now available for thermal or PDF export.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/wallet/ledger')}
            className="px-8 py-3 bg-slate-900 text-white rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-colors shadow-xl shadow-slate-200"
          >
            Export Now
          </button>
        </motion.div>

      </div>
    </Layout>
  );
};

export default TransactionsPage;
