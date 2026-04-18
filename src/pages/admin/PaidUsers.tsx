import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, 
    Search, 
    ChevronRight, 
    Crown, 
    Briefcase, 
    Users, 
    ArrowUpRight,
    TrendingUp,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PaidUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [planFilter, setPlanFilter] = useState<string>("PRO");
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchPaidUsers();
    }, [page, search, planFilter]);

    const fetchPaidUsers = async () => {
        setLoading(true);
        try {
            const { data, count } = await adminService.getUsers(page, 50, search, planFilter);
            setUsers(data || []);
            setTotalCount(count || 0);
        } catch (e) {
            toast.error("Failed to load paid users");
        } finally {
            setLoading(false);
        }
    };

    const SummaryCard = ({ title, count, icon: Icon, color, active }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
                active ? "border-emerald-500/30 bg-emerald-50/50" : "border-slate-100 bg-white"
            )}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-xl bg-opacity-10", color)}>
                    <Icon className={cn("w-5 h-5", color.replace('bg-', 'text-'))} />
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    +12%
                </div>
            </div>
            <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</p>
                <div className="flex items-end gap-2">
                    <h3 className="text-3xl font-black text-slate-900 leading-none">{count}</h3>
                    <span className="text-xs font-bold text-slate-400 mb-1">Users</span>
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03]">
                <Icon className="w-24 h-24" />
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-8 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Administrative Console</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Paid Subscribers <Crown className="w-8 h-8 text-amber-500 fill-amber-500" />
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Industrial-grade monitoring for premium member accounts.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <Button 
                            variant="ghost"
                            onClick={() => setPlanFilter('PRO')}
                            className={cn(
                                "rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest transition-all",
                                planFilter === 'PRO' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Crown className="w-3.5 h-3.5 mr-2" />
                            Pro Tier
                        </Button>
                        <Button 
                            variant="ghost"
                            onClick={() => setPlanFilter('BUSINESS')}
                            className={cn(
                                "rounded-xl h-10 px-6 font-black uppercase text-[10px] tracking-widest transition-all",
                                planFilter === 'BUSINESS' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Briefcase className="w-3.5 h-3.5 mr-2" />
                            Business
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SummaryCard 
                    title="Active Members" 
                    count={totalCount} 
                    icon={Users} 
                    color="bg-blue-600" 
                />
                <SummaryCard 
                    title="Pro Subscribers" 
                    count={planFilter === 'PRO' ? totalCount : '--'} 
                    icon={Crown} 
                    color="bg-amber-500"
                    active={planFilter === 'PRO'}
                />
                <SummaryCard 
                    title="Enterprise" 
                    count={planFilter === 'BUSINESS' ? totalCount : '--'} 
                    icon={ShieldCheck} 
                    color="bg-emerald-600"
                    active={planFilter === 'BUSINESS'}
                />
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                        placeholder="Search members by name, email, or identifier..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-14 pl-12 pr-6 bg-white border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-900"
                    />
                </div>
                <Button className="h-14 px-8 rounded-2xl bg-neutral-900 hover:bg-black text-white font-black uppercase tracking-widest text-[11px] shadow-xl transition-all active:scale-95 group">
                    Export Data <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
            </div>

            {/* Users Table */}
            <Card className="border-slate-200 shadow-2xl bg-white overflow-hidden rounded-[2rem]">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-900 border-b-0">
                                <TableRow className="hover:bg-slate-900 border-none">
                                    <TableHead className="h-16 font-black uppercase tracking-widest text-[10px] text-slate-400 px-8">Member Information</TableHead>
                                    <TableHead className="h-16 font-black uppercase tracking-widest text-[10px] text-slate-400">Subscription Status</TableHead>
                                    <TableHead className="h-16 font-black uppercase tracking-widest text-[10px] text-slate-400">Capital Balance</TableHead>
                                    <TableHead className="h-16 font-black uppercase tracking-widest text-[10px] text-slate-400">Engagement Date</TableHead>
                                    <TableHead className="h-16 font-black uppercase tracking-widest text-[10px] text-slate-400 text-right px-8">Operations</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="wait">
                                    {loading ? (
                                        <TableRow className="border-none">
                                            <TableCell colSpan={5} className="h-64 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Retrieving Secure Records...</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow className="border-none">
                                            <TableCell colSpan={5} className="h-64 text-center">
                                                <div className="flex flex-col items-center opacity-40">
                                                    <Search className="h-12 w-12 text-slate-400 mb-2" />
                                                    <p className="text-sm font-bold text-slate-500">No members match your criteria.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user, idx) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.03 }}
                                                className="group border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-default"
                                            >
                                                <TableCell className="py-6 px-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                                                            {user.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
                                                                {user.full_name || 'Anonymous User'}
                                                            </div>
                                                            <div className="text-xs text-slate-400 font-bold tracking-tight">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <Badge className={cn(
                                                        "rounded-full px-4 py-1 border-none font-black text-[10px] uppercase tracking-widest",
                                                        user.plan_type === 'PRO' ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                                                    )}>
                                                        {user.plan_type || 'STANDARD'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-lg font-black text-slate-900">₹{user.wallets?.balance?.toLocaleString() || 0}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">Available Capital</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6">
                                                    <div className="text-sm font-bold text-slate-600">
                                                        {new Date(user.created_at).toLocaleDateString(undefined, { 
                                                            year: 'numeric', 
                                                            month: 'short', 
                                                            day: 'numeric' 
                                                        })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 text-right px-8">
                                                    <Button 
                                                        variant="ghost" 
                                                        className="h-11 px-6 rounded-xl text-blue-600 font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 transition-all active:scale-95 flex items-center gap-2 ml-auto"
                                                        onClick={() => navigate(`/admin/users`)}
                                                    >
                                                        Manage Protocol <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaidUsers;

