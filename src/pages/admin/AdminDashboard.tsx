import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminService } from "@/services/admin";
import { Loader2, ArrowUpRight, AlertCircle, CheckCircle2, Clock, Users, Activity, IndianRupee, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalVolume: 0,
        pendingTxns: 0,
        pendingKYC: 0,
        pendingManualFunds: 0,
        successRate: 0
    });
    const [recentTxns, setRecentTxns] = useState<any[]>([]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const users = await adminService.getUsers(1, 1);
            const allTxns = await adminService.getTransactions();
            const pendingKYC = await adminService.getPendingKYCCount();
            const pendingManual = await adminService.getPendingManualFundCount();

            const txns = allTxns.data || [];
            const successful = txns.filter(t => t.status === 'SUCCESS');
            const pending = txns.filter(t => t.status === 'PENDING');

            const totalVol = successful.reduce((sum, t) => sum + Number(t.amount), 0);
            const rate = txns.length ? (successful.length / txns.length) * 100 : 0;

            setStats({
                totalUsers: users.count || 0,
                totalVolume: totalVol,
                pendingTxns: pending.length,
                pendingKYC,
                pendingManualFunds: pendingManual,
                successRate: Math.round(rate)
            });

            setRecentTxns(txns.slice(0, 5));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="font-medium animate-pulse">Loading dashboard statistics...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard Overview</h2>
                <p className="text-slate-500 mt-1">Here's what's happening with your platform today.</p>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-slate-200/60 bg-white/60 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <IndianRupee className="w-16 h-16 text-blue-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-bold text-slate-900">₹{stats.totalVolume.toLocaleString()}</div>
                        <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center bg-emerald-50 w-fit px-2 py-1 rounded-full">
                            <ArrowUpRight className="h-3 w-3 mr-1" /> Lifetime volume
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-cyan-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>

                <Card className="relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-slate-200/60 bg-white/60 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Activity className="w-16 h-16 text-indigo-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-bold text-slate-900">{stats.pendingTxns} <span className="text-lg font-medium text-slate-400">Txns</span></div>
                        <div className="mt-2 flex gap-2">
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> {stats.pendingKYC} KYC
                            </span>
                            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full flex items-center">
                                <Clock className="w-3 h-3 mr-1" /> {stats.pendingManualFunds} Manual
                            </span>
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>

                <Card className="relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-slate-200/60 bg-white/60 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PieChart className="w-16 h-16 text-emerald-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-bold text-slate-900">{stats.successRate}%</div>
                        <div className="mt-2 text-xs font-medium text-slate-500 flex items-center bg-slate-100 w-fit px-2 py-1 rounded-full">
                            Based on {recentTxns.length} transactions
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>

                <Card className="relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 border-slate-200/60 bg-white/60 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Users className="w-16 h-16 text-pink-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-bold text-slate-900">{stats.totalUsers}</div>
                        <div className="mt-2 text-xs font-medium text-pink-600 flex items-center bg-pink-50 w-fit px-2 py-1 rounded-full">
                            Total registered accounts
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-pink-500 to-rose-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>
            </div>

            {/* Recent Transactions List with Premium Styling */}
            <Card className="border-slate-200/60 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-lg font-bold text-slate-900">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">Transaction Details</th>
                                    <th className="px-6 py-4 font-semibold whitespace-nowrap">User Identifer</th>
                                    <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Amount</th>
                                    <th className="px-6 py-4 font-semibold text-right whitespace-nowrap">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTxns.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                            No recent transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    recentTxns.map((txn) => (
                                        <tr key={txn.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-xl transition-transform group-hover:scale-110 ${txn.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' : txn.status === 'FAILED' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                                        {txn.status === 'SUCCESS' ? <CheckCircle2 className="h-4 w-4" /> : txn.status === 'FAILED' ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                                    </div>
                                                    <span className="font-semibold text-slate-700 whitespace-nowrap">{txn.service_type} - {txn.operator_name || 'Wallet'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                                                {txn.mobile_number || (txn.id ? txn.id.substring(0, 8) + '...' : 'N/A')}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-900 whitespace-nowrap">₹{txn.amount}</td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <Badge
                                                    variant="outline"
                                                    className={`px-3 py-1 font-semibold border-0 ${txn.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                                                            txn.status === 'FAILED' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-amber-100 text-amber-700'
                                                        }`}
                                                >
                                                    {txn.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboard;
