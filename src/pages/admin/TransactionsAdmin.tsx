import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    ArrowUpRight, ArrowDownLeft, Search, ReceiptText,
    TrendingUp, TrendingDown, Activity, Users2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Txn {
    id: string;
    user_id: string;
    type: string;
    service_type: string;
    amount: number;
    status: string;
    description: string | null;
    mobile_number: string | null;
    reference_id: string | null;
    commission: number | null;
    created_at: string;
    profiles: { full_name: string | null; email: string | null; phone: string | null } | null;
}

const formatDT = (iso: string) =>
    new Date(iso).toLocaleString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });

const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
        FAILED: "bg-rose-50 text-rose-700 border-rose-200",
        PENDING: "bg-amber-50 text-amber-700 border-amber-200",
        REFUNDED: "bg-indigo-50 text-indigo-700 border-indigo-200",
    };
    return (
        <Badge className={cn("text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border", map[status] || "bg-slate-50 text-slate-500 border-slate-200")}>
            {status}
        </Badge>
    );
};

const TypePill = ({ type }: { type: string }) => {
    const isCredit = type === "CREDIT";
    return (
        <span className={cn(
            "flex items-center gap-1 text-xs font-black rounded-full px-2.5 py-1 w-fit",
            isCredit ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600"
        )}>
            {isCredit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
            {isCredit ? "Credit" : "Debit"}
        </span>
    );
};

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) => (
    <Card className="border-slate-100 shadow-sm bg-white rounded-2xl">
        <CardContent className="p-5 flex items-center gap-4">
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", color)}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-xl font-black text-slate-900 mt-0.5">{value}</p>
            </div>
        </CardContent>
    </Card>
);

const TransactionsAdmin = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");

    const { data: txns = [], isLoading } = useQuery<Txn[]>({
        queryKey: ["admin_all_transactions"],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from("transactions")
                .select("*, profiles(full_name, email, phone)")
                .order("created_at", { ascending: false })
                .limit(500);
            if (error) throw error;
            return data || [];
        },
        refetchInterval: 60000,
        staleTime: 30000,
    });

    const filtered = useMemo(() => {
        return txns.filter((t) => {
            const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
            const matchType = typeFilter === "ALL" || t.type === typeFilter;
            const q = search.toLowerCase();
            const matchSearch = !q ||
                t.profiles?.full_name?.toLowerCase().includes(q) ||
                t.profiles?.email?.toLowerCase().includes(q) ||
                t.mobile_number?.includes(q) ||
                t.reference_id?.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q) ||
                t.service_type?.toLowerCase().includes(q);
            return matchStatus && matchType && matchSearch;
        });
    }, [txns, statusFilter, typeFilter, search]);

    // Stats
    const totalCredit = txns.filter(t => t.type === "CREDIT" && t.status === "SUCCESS").reduce((s, t) => s + Number(t.amount), 0);
    const totalDebit = txns.filter(t => t.type === "DEBIT" && t.status === "SUCCESS").reduce((s, t) => s + Number(t.amount), 0);
    const uniqueUsers = new Set(txns.map(t => t.user_id)).size;
    const pending = txns.filter(t => t.status === "PENDING").length;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Transactions Ledger</h2>
                <p className="text-slate-500 mt-1 font-medium">All user transactions — credits, debits, recharges and wallet activity.</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Credited" value={`₹${totalCredit.toLocaleString("en-IN")}`} icon={TrendingUp} color="bg-emerald-500" />
                <StatCard label="Total Debited" value={`₹${totalDebit.toLocaleString("en-IN")}`} icon={TrendingDown} color="bg-rose-500" />
                <StatCard label="Unique Users" value={`${uniqueUsers}`} icon={Users2} color="bg-blue-500" />
                <StatCard label="Pending" value={`${pending}`} icon={Activity} color="bg-amber-500" />
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <Input
                        className="pl-10 h-11 rounded-xl border-slate-200 bg-white shadow-sm font-medium"
                        placeholder="Search by user, mobile, reference, or transaction ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-11 w-[160px] rounded-xl border-slate-200 bg-white font-semibold shadow-sm">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="ALL">All Types</SelectItem>
                        <SelectItem value="CREDIT">Credit Only</SelectItem>
                        <SelectItem value="DEBIT">Debit Only</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-11 w-[160px] rounded-xl border-slate-200 bg-white font-semibold shadow-sm">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="SUCCESS">Success</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Count */}
            <p className="text-xs font-bold text-slate-400">
                Showing <span className="text-slate-700">{filtered.length}</span> of <span className="text-slate-700">{txns.length}</span> transactions
            </p>

            {/* Table */}
            <Card className="border-slate-100 shadow-sm overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Date & Time</TableHead>
                                    <TableHead className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">User</TableHead>
                                    <TableHead className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Type</TableHead>
                                    <TableHead className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Service / Description</TableHead>
                                    <TableHead className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Amount</TableHead>
                                    <TableHead className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Reference</TableHead>
                                    <TableHead className="py-4 text-xs font-black text-slate-400 uppercase tracking-wider whitespace-nowrap">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    [...Array(6)].map((_, i) => (
                                        <TableRow key={i}>
                                            {[...Array(7)].map((_, j) => (
                                                <TableCell key={j} className="py-4"><Skeleton className="h-5 w-full rounded-lg" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                                <ReceiptText className="w-10 h-10 text-slate-200" />
                                                <p className="font-bold text-slate-500">No transactions found</p>
                                                <p className="text-xs">Try changing filters or search terms.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((t) => (
                                        <TableRow key={t.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0">
                                            {/* Date */}
                                            <TableCell className="py-3.5 whitespace-nowrap">
                                                <p className="text-xs font-bold text-slate-800">{formatDT(t.created_at)}</p>
                                            </TableCell>

                                            {/* User — privacy: show name, mask email partially */}
                                            <TableCell className="py-3.5">
                                                <p className="text-sm font-bold text-slate-800 truncate max-w-[130px]">
                                                    {t.profiles?.full_name || "—"}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[130px]">
                                                    {t.profiles?.email
                                                        ? t.profiles.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
                                                        : "—"}
                                                </p>
                                                {t.mobile_number && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">{t.mobile_number}</p>
                                                )}
                                            </TableCell>

                                            {/* Type */}
                                            <TableCell className="py-3.5">
                                                <TypePill type={t.type} />
                                            </TableCell>

                                            {/* Service */}
                                            <TableCell className="py-3.5">
                                                <p className="text-sm font-bold text-slate-800 capitalize max-w-[180px] truncate">
                                                    {(t.service_type || t.description || "Wallet Transaction").replace(/_/g, " ")}
                                                </p>
                                                {t.description && t.service_type && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5 max-w-[180px] truncate">{t.description}</p>
                                                )}
                                            </TableCell>

                                            {/* Amount */}
                                            <TableCell className="py-3.5 whitespace-nowrap">
                                                <span className={cn(
                                                    "text-base font-black",
                                                    t.type === "CREDIT" ? "text-emerald-600" : "text-rose-600"
                                                )}>
                                                    {t.type === "CREDIT" ? "+" : "−"}₹{Number(t.amount).toLocaleString("en-IN")}
                                                </span>
                                                {t.commission ? (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">Commission: ₹{t.commission}</p>
                                                ) : null}
                                            </TableCell>

                                            {/* Reference */}
                                            <TableCell className="py-3.5">
                                                <p className="text-xs font-mono text-slate-500 truncate max-w-[120px]">
                                                    {t.reference_id || t.id.slice(0, 12) + "..."}
                                                </p>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="py-3.5">
                                                <StatusBadge status={t.status} />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TransactionsAdmin;
