import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { adminService } from "@/services/admin";
import { 
    Loader2, 
    ArrowUpRight, 
    AlertCircle, 
    CheckCircle2, 
    Clock, 
    Users, 
    Activity, 
    IndianRupee, 
    PieChart, 
    ChevronRight, 
    ExternalLink, 
    ShieldCheck, 
    Layers, 
    Megaphone,
    ArrowRightLeft,
    TrendingUp,
    Server,
    Wifi
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { startTelegramBotListener, stopTelegramBotListener } from "@/services/telegramBot.service";

const AdminDashboard = () => {
    const navigate = useNavigate();
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
        
        // Listen to external telegram approval events to trigger instant updates
        const handleInstantUpdate = () => {
            console.log("Instant update event received from Telegram bot...");
            fetchData();
        };
        window.addEventListener('admin_kyc_requests_updated', handleInstantUpdate);
        window.addEventListener('admin_fund_requests_updated', handleInstantUpdate);
        window.addEventListener('prepe_users_updated', handleInstantUpdate);
        
        // Start background Telegram Administrative Co-Pilot listener
        startTelegramBotListener();
        
        return () => {
            clearInterval(interval);
            window.removeEventListener('admin_kyc_requests_updated', handleInstantUpdate);
            window.removeEventListener('admin_fund_requests_updated', handleInstantUpdate);
            window.removeEventListener('prepe_users_updated', handleInstantUpdate);
            stopTelegramBotListener();
        };
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
            <p className="font-semibold text-slate-600 animate-pulse text-sm">Synchronizing live statistics...</p>
        </div>
    );

    const quickLinks = [
        { title: "Complaints & Support Desk", desc: "Process refunds or retries", path: "/admin/complaints", color: "from-amber-500 to-orange-600", icon: AlertCircle },
        { title: "User Management Grid", desc: "Adjust wallets and custom limits", path: "/admin/users", color: "from-blue-500 to-indigo-600", icon: Users },
        { title: "KYC Document Verifications", desc: "Verify Aadhar and PAN approvals", path: "/admin/kyc", color: "from-emerald-500 to-teal-600", icon: ShieldCheck },
        { title: "Membership Plans Settings", desc: "Manage parameters and features", path: "/admin/plan-manager", color: "from-purple-500 to-pink-600", icon: Layers },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Block */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
                        Administrative Dashboard Overview
                    </h2>
                    <p className="text-slate-500 mt-1.5 font-medium">
                        Real-time transaction volumes, account creations, and operational control desks.
                    </p>
                </div>
                
                {/* Active Sync Status Badge */}
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3.5 py-1.5 rounded-full text-emerald-700 text-xs font-bold w-fit">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Live Synced with Supabase
                </div>
            </div>

            {/* Redesigned Premium Stat Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* Card 1: Revenue */}
                <Card className="relative overflow-hidden group border-slate-200/60 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.015)] rounded-2xl hover:shadow-[0_15px_35px_rgba(37,99,235,0.08)] hover:-translate-y-1 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                        <IndianRupee className="w-16 h-16 text-blue-600" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Platform Volume</CardTitle>
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">₹{stats.totalVolume.toLocaleString()}</div>
                        <div className="mt-2.5 text-[10px] font-black text-emerald-700 bg-emerald-50 w-fit px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-emerald-100 flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" /> Lifetime volume
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>

                {/* Card 2: Pending Requests */}
                <Card className="relative overflow-hidden group border-slate-200/60 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.015)] rounded-2xl hover:shadow-[0_15px_35px_rgba(245,158,11,0.08)] hover:-translate-y-1 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                        <Activity className="w-16 h-16 text-amber-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Pending Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.pendingTxns} <span className="text-lg font-medium text-slate-400">Txns</span></div>
                        <div className="mt-2.5 flex gap-1.5 flex-wrap">
                            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-100 text-[9px] font-bold px-2 py-0 uppercase">
                                <Clock className="w-2.5 h-2.5 mr-1" /> {stats.pendingKYC} KYC
                            </Badge>
                            <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border border-indigo-100 text-[9px] font-bold px-2 py-0 uppercase">
                                <Clock className="w-2.5 h-2.5 mr-1" /> {stats.pendingManualFunds} Funds
                            </Badge>
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>

                {/* Card 3: Success Rate */}
                <Card className="relative overflow-hidden group border-slate-200/60 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.015)] rounded-2xl hover:shadow-[0_15px_35px_rgba(16,185,129,0.08)] hover:-translate-y-1 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                        <PieChart className="w-16 h-16 text-emerald-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Success Rate</CardTitle>
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.successRate}%</div>
                        <div className="mt-2.5 text-[10px] font-black text-slate-500 bg-slate-50 border border-slate-100 w-fit px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Based on live sampling
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>

                {/* Card 4: Active Users */}
                <Card className="relative overflow-hidden group border-slate-200/60 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.015)] rounded-2xl hover:shadow-[0_15px_35px_rgba(139,92,246,0.08)] hover:-translate-y-1 transition-all duration-500">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                        <Users className="w-16 h-16 text-purple-500" />
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                        <CardTitle className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Active Accounts</CardTitle>
                    </CardHeader>
                    <CardContent className="z-10 relative">
                        <div className="text-3xl font-black text-slate-900 tracking-tight">{stats.totalUsers}</div>
                        <div className="mt-2.5 text-[10px] font-black text-purple-700 bg-purple-50 border border-purple-100 w-fit px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Registered Profiles
                        </div>
                    </CardContent>
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                </Card>
            </div>

            {/* Quick Navigation Control Panel & Network Hub */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Control Panel: Quick Links */}
                <Card className="border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] bg-white rounded-2xl lg:col-span-2 overflow-hidden flex flex-col justify-between">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <CardTitle className="text-lg font-black text-slate-800">Quick Administrative Actions</CardTitle>
                        <CardDescription className="text-slate-500 font-medium mt-1">Jump directly to standard operational control desks</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 grid gap-4 grid-cols-1 md:grid-cols-2 flex-1">
                        {quickLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className="flex items-start text-left gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200/60 hover:bg-blue-50/20 transition-all duration-300 group"
                            >
                                <div className={`p-3 rounded-xl bg-gradient-to-tr ${link.color} text-white shadow-md shadow-slate-200 group-hover:scale-105 transition-transform duration-300`}>
                                    <link.icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1 group-hover:text-blue-600 transition-colors">
                                        {link.title}
                                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                                    </h4>
                                    <p className="text-xs font-medium text-slate-400 mt-1">{link.desc}</p>
                                </div>
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Status Hub: Network & Proxy Controls */}
                <Card className="border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.015)] bg-white rounded-2xl overflow-hidden flex flex-col">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
                        <CardTitle className="text-lg font-black text-slate-800">Operational Connectivity</CardTitle>
                        <CardDescription className="text-slate-500 font-medium mt-1">Status of live outbound proxy & APIs</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3.5">
                            {/* Proxy IP */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Server className="h-4.5 w-4.5 text-blue-500" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-600">Static Exit Proxy</p>
                                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">52.5.155.132 (Fixie)</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] font-black uppercase">Active</Badge>
                            </div>

                            {/* Database connectivity */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Activity className="h-4.5 w-4.5 text-indigo-500" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-600">Database Pool</p>
                                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">Supabase PostgreSQL</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] font-black uppercase">Connected</Badge>
                            </div>

                            {/* Operator tunnels */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <Wifi className="h-4.5 w-4.5 text-emerald-500" />
                                    <div>
                                        <p className="text-xs font-bold text-slate-600">Kwik API Gateways</p>
                                        <p className="font-mono text-[10px] text-slate-400 mt-0.5">Recharge Operator Gate</p>
                                    </div>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] font-black uppercase">Online</Badge>
                            </div>
                        </div>

                        <Button 
                            variant="outline" 
                            className="w-full rounded-xl font-bold h-11 border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                            onClick={() => navigate("/admin/network-diagnostics" as any)}
                        >
                            Run Diagnostics <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions List with Redesigned Light-Theme Layout */}
            <Card className="border-slate-200/60 shadow-[0_12px_40px_rgba(0,0,0,0.015)] bg-white rounded-2xl overflow-hidden">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-black text-slate-800">Recent Transactions</CardTitle>
                        <CardDescription className="text-slate-500 font-medium mt-1">Audit log of the latest 5 transaction statuses across the platform.</CardDescription>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate("/admin/transactions")} 
                        className="rounded-xl font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm flex items-center gap-1"
                    >
                        View All <ArrowRightLeft className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50/80 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4 font-black tracking-widest text-slate-400">Transaction Details</th>
                                    <th className="px-6 py-4 font-black tracking-widest text-slate-400">User Identifier</th>
                                    <th className="px-6 py-4 font-black tracking-widest text-slate-400 text-right">Amount</th>
                                    <th className="px-6 py-4 font-black tracking-widest text-slate-400 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentTxns.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                                            No recent transactions found.
                                        </td>
                                    </tr>
                                ) : (
                                    recentTxns.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-xl transition-transform group-hover:scale-105 shadow-sm border ${
                                                        txn.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                        txn.status === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                        {txn.status === 'SUCCESS' ? <CheckCircle2 className="h-4 w-4" /> : txn.status === 'FAILED' ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <span className="font-extrabold text-slate-800 text-sm leading-snug">{txn.service_type} - {txn.operator_name || 'Wallet Adjustment'}</span>
                                                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">ID: {txn.id ? txn.id.substring(0, 12).toUpperCase() : 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4.5 text-slate-600 font-semibold whitespace-nowrap">
                                                {txn.mobile_number || (txn.id ? txn.id.substring(0, 8) + '...' : 'N/A')}
                                            </td>
                                            <td className="px-6 py-4.5 text-right font-black text-base text-slate-900 whitespace-nowrap">₹{Number(txn.amount).toFixed(2)}</td>
                                            <td className="px-6 py-4.5 text-right whitespace-nowrap">
                                                <Badge
                                                    variant="outline"
                                                    className={`px-3 py-1 font-bold border-0 uppercase text-[9px] tracking-wider ${
                                                        txn.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
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
