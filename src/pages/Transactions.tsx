import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  History, 
  Wallet, 
  FileBarChart, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight,
  Download,
  Filter,
  Search,
  ArrowDownLeft,
  Smartphone,
  Zap,
  MoreVertical,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { getTransactionHistory } from '@/services/recharge.service';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

const normalizeTransactionStatus = (status?: string): 'SUCCESS' | 'FAILED' | 'PENDING' => {
  if (!status) return 'PENDING';
  const normalized = status.toUpperCase();
  if (normalized === 'SUCCESS' || normalized === 'SUCCESSFUL') {
    return 'SUCCESS';
  }
  if (
    normalized === 'FAILED' || 
    normalized === 'FAILURE' || 
    normalized === 'FAIL' || 
    normalized === 'REJECTED' || 
    normalized === 'CANCELLED' || 
    normalized === 'ERROR'
  ) {
    return 'FAILED';
  }
  return 'PENDING';
};

const TransactionsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const loadTransactions = async () => {
      if (user) {
        setLoading(true);
        const data = await getTransactionHistory(user.id, 50);
        setTransactions(data);
        setLoading(false);
      }
    };
    loadTransactions();
  }, [user]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.mobile_number?.includes(searchQuery) || t.id.includes(searchQuery);
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && normalizeTransactionStatus(t.status) === activeTab;
  });

  const stats = {
    total: transactions.reduce((acc, t) => acc + (normalizeTransactionStatus(t.status) === 'SUCCESS' ? Number(t.amount) : 0), 0),
    count: transactions.filter(t => normalizeTransactionStatus(t.status) === 'SUCCESS').length
  };

  return (
    <Layout hideHeader showBottomNav>
      <div className="min-h-screen bg-slate-50/50 pb-32">
        
        {/* Immersive Header Card */}
        <div className="bg-slate-900 pt-6 pb-20 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse"></div>
          
          <div className="relative z-10 max-w-5xl mx-auto">
            {/* Header Top Bar */}
            <div className="flex items-center gap-3 mb-8">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-sm font-black text-white uppercase tracking-[0.2em]">Reports & Activity</h2>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="space-y-1">
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">Total Volume</p>
                <h1 className="text-4xl font-black text-white tracking-tighter">₹{stats.total.toLocaleString()}</h1>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <TrendingUp className="h-6 w-6 text-emerald-400" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Success Rate</p>
                 <p className="text-xl font-black text-white">98.4%</p>
               </div>
               <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Orders</p>
                 <p className="text-xl font-black text-white">{stats.count}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
          
          <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
            <div className="bg-white rounded-[32px] shadow-xl shadow-slate-200/50 p-2 border border-slate-100 mb-6">
              <TabsList className="grid grid-cols-4 w-full bg-transparent h-12">
                <TabsTrigger value="all" className="rounded-2xl data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase transition-all">ALL</TabsTrigger>
                <TabsTrigger value="SUCCESS" className="rounded-2xl data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase transition-all">DONE</TabsTrigger>
                <TabsTrigger value="PENDING" className="rounded-2xl data-[state=active]:bg-amber-500 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase transition-all">PENDING</TabsTrigger>
                <TabsTrigger value="FAILED" className="rounded-2xl data-[state=active]:bg-rose-500 data-[state=active]:text-white font-black text-[10px] tracking-widest uppercase transition-all">FAILED</TabsTrigger>
              </TabsList>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                <Input 
                  placeholder="Search by number or ID..." 
                  className="h-14 bg-white border-none shadow-sm rounded-2xl pl-12 font-medium text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-100"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button size="icon" className="h-14 w-14 rounded-2xl bg-white border-none shadow-sm text-slate-400 hover:text-slate-900">
                <Calendar className="h-5 w-5" />
              </Button>
            </div>

            <TabsContent value={activeTab} className="mt-0 outline-none">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className="h-24 bg-white rounded-3xl animate-pulse border border-slate-100"></div>
                    ))
                  ) : filteredTransactions.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto opacity-50">
                        <History className="h-10 w-10 text-slate-300" />
                      </div>
                      <p className="text-slate-400 font-bold tracking-tight">No transactions found</p>
                    </div>
                  ) : filteredTransactions.map((txn, index) => (
                    <motion.div
                      key={txn.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => navigate(`/transaction/${txn.id}`, { state: { transaction: txn } })}
                      className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer flex items-center gap-4 group active:scale-[0.98]"
                    >
                      {/* Icon Section */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        txn.service_type.includes('MOBILE') ? 'bg-blue-50 text-blue-600' :
                        txn.service_type.includes('DTH') ? 'bg-purple-50 text-purple-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {txn.service_type.includes('MOBILE') ? <Smartphone className="h-7 w-7" /> :
                         txn.service_type.includes('DTH') ? <Zap className="h-7 w-7" /> :
                         <Zap className="h-7 w-7" />}
                      </div>

                      {/* Detail Section */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-lg font-black text-slate-800 tracking-tighter leading-none">
                            {txn.mobile_number || 'Internal'}
                          </p>
                          <p className="text-lg font-black text-slate-900 leading-none">₹{Number(txn.amount).toFixed(0)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                             {txn.operator_id || 'RECHARGE'} • {format(new Date(txn.created_at), 'MMM dd, HH:mm')}
                           </p>
                        </div>
                      </div>

                      {/* Status Section */}
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={`rounded-full px-3 py-0.5 text-[9px] font-black tracking-widest border-none ${
                          normalizeTransactionStatus(txn.status) === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                          normalizeTransactionStatus(txn.status) === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'
                        }`}>
                          {normalizeTransactionStatus(txn.status)}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-slate-200 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </TabsContent>
          </Tabs>

          {/* Advanced Reports Section */}
          <div className="mt-12 space-y-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
              Advanced Analytics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div 
                onClick={() => navigate('/wallet/ledger')}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer group"
               >
                 <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                   <Wallet className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="font-black text-slate-800 tracking-tight">Wallet Ledger</h3>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Credit & Debit History</p>
                 </div>
                 <ChevronRight className="ml-auto w-5 h-5 text-slate-200" />
               </div>

               <div 
                onClick={() => navigate('/reports/history')}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 hover:shadow-lg transition-all cursor-pointer group"
               >
                 <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                   <FileBarChart className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="font-black text-slate-800 tracking-tight">Account Statement</h3>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Monthly PDF Exports</p>
                 </div>
                 <ChevronRight className="ml-auto w-5 h-5 text-slate-200" />
               </div>
            </div>
          </div>

          {/* Quick Action FAB-style Button */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="fixed bottom-24 right-6 z-50 md:hidden"
          >
            <button 
              onClick={() => navigate('/wallet')}
              className="w-16 h-16 bg-blue-600 rounded-full shadow-2xl shadow-blue-400 flex items-center justify-center text-white hover:bg-blue-700 active:scale-90 transition-all"
            >
              <Wallet className="h-7 w-7" />
            </button>
          </motion.div>

        </div>
      </div>
    </Layout>
  );
};

export default TransactionsPage;
