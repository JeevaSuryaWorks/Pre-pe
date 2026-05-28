import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    Search, ShoppingBag, CreditCard, User,
    TrendingUp, Users2, ShoppingCart, Wallet,
    ChevronLeft, ChevronRight, RefreshCw, ExternalLink,
    CheckCircle2, Clock, XCircle, Eye, Package
} from "lucide-react";
import { BrandLoader } from '@/components/ui/BrandLoader';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PrePeSpinner } from "@/components/ui/BrandLoader";

const PAGE_SIZE = 15;

export default function AdminBuyers() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [walletDialog, setWalletDialog] = useState(false);
    const [viewDialog, setViewDialog] = useState(false);

    // Wallet Adjustment Form
    const [adjType, setAdjType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
    const [adjAmount, setAdjAmount] = useState("");
    const [adjReason, setAdjReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        fetchBuyers();
    }, [page, debouncedSearch]);

    const fetchBuyers = async () => {
        setLoading(true);
        try {
            const { data, total } = await adminService.getUsers(page, PAGE_SIZE, debouncedSearch);
            setUsers(data || []);
            setTotalCount(total || data?.length || 0);
        } catch (e) {
            toast.error("Failed to load buyers list");
        } finally {
            setLoading(false);
        }
    };

    const handleWalletAdjustment = async () => {
        if (!selectedUser || !adjAmount || !adjReason) return;
        setSubmitting(true);
        try {
            await adminService.adjustWallet(selectedUser.user_id, adjType, Number(adjAmount), adjReason);
            toast.success(`Wallet ${adjType === 'CREDIT' ? 'credited' : 'debited'} ₹${adjAmount} for ${selectedUser.full_name || selectedUser.email}`);
            setWalletDialog(false);
            setAdjAmount("");
            setAdjReason("");
            fetchBuyers();
        } catch (e: any) {
            toast.error(e.message || "Adjustment failed");
        } finally {
            setSubmitting(false);
        }
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const kycApproved = users.filter(u => u.kyc_status === 'APPROVED').length;

    // Summary stat cards
    const statCards = [
        {
            icon: Users2,
            label: "Total Buyers",
            value: totalCount,
            color: "bg-indigo-50 text-[#000080] border-indigo-100",
            iconColor: "text-[#000080]",
        },
        {
            icon: CheckCircle2,
            label: "KYC Approved",
            value: kycApproved,
            color: "bg-emerald-50 text-emerald-700 border-emerald-100",
            iconColor: "text-emerald-600",
        },
        {
            icon: Clock,
            label: "KYC Pending",
            value: users.filter(u => u.kyc_status === 'PENDING').length,
            color: "bg-amber-50 text-amber-700 border-amber-100",
            iconColor: "text-amber-500",
        },
        {
            icon: Wallet,
            label: "Avg. Balance",
            value: `₹${users.length ? Math.round(users.reduce((a, u) => a + (u.wallets?.balance || 0), 0) / users.length).toLocaleString() : '0'}`,
            color: "bg-purple-50 text-purple-700 border-purple-100",
            iconColor: "text-purple-500",
        },
    ];

    return (
        <div className="space-y-6">

            {/* ── Page Header ── */}
            <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-300/30">
                            <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-[#000080] uppercase tracking-wider">Buyers Directory</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">
                                Manage e-commerce customers · {totalCount.toLocaleString()} registered
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search */}
                        <div className="flex items-center gap-2 bg-slate-50 rounded-xl border border-slate-150 px-3 py-2 w-full md:w-72">
                            <Search className="h-4 w-4 text-slate-400 shrink-0" />
                            <input
                                placeholder="Search name, email, phone..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="border-0 bg-transparent focus:outline-none w-full text-xs font-semibold text-slate-700 placeholder:text-slate-400"
                            />
                        </div>
                        <button
                            onClick={fetchBuyers}
                            className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors shrink-0"
                            title="Refresh"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((s) => (
                    <div
                        key={s.label}
                        className={`bg-white rounded-2xl p-5 border ${s.color} shadow-sm flex items-center gap-3`}
                    >
                        <div className={`h-10 w-10 rounded-xl bg-white/80 border ${s.color} flex items-center justify-center shadow-sm shrink-0`}>
                            <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                        </div>
                        <div>
                            <div className="text-lg font-black">{s.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-wider opacity-70">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Buyers Table ── */}
            <Card className="border-slate-100 shadow-sm rounded-[2rem] overflow-hidden bg-white">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/80 border-b border-slate-100">
                                <TableRow>
                                    <TableHead className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest pl-6">Buyer</TableHead>
                                    <TableHead className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Contact</TableHead>
                                    <TableHead className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">Wallet</TableHead>
                                    <TableHead className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest">KYC</TableHead>
                                    <TableHead className="py-4 font-black text-slate-400 uppercase text-[10px] tracking-widest text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-52 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                                                <BrandLoader size="md" message="Gathering Shoppers..." />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                                <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                                                    <Users2 className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-xs font-bold uppercase tracking-wider">No buyers found matching "{debouncedSearch}"</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-50 last:border-0">
                                            {/* Avatar + Name */}
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-100 text-[#000080] flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                                                        {(user.full_name || user.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 text-xs">{user.full_name || 'Anonymous Buyer'}</div>
                                                        <div className="text-[10px] text-slate-400 font-semibold tracking-tight mt-0.5 truncate max-w-[160px]">{user.email}</div>
                                                        <div className="text-[9px] font-mono text-slate-300 mt-0.5">{user.id?.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Contact */}
                                            <TableCell className="py-4">
                                                <div className="text-xs font-bold text-slate-700">{user.phone || '—'}</div>
                                                <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                                    Joined {new Date(user.created_at || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                                                </div>
                                            </TableCell>

                                            {/* Wallet */}
                                            <TableCell className="py-4">
                                                <div className="font-black text-sm text-slate-800">₹{(user.wallets?.balance || 0).toLocaleString()}</div>
                                                {user.wallets?.locked_balance > 0 && (
                                                    <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded px-1.5 mt-0.5 inline-block">
                                                        Locked: ₹{user.wallets.locked_balance}
                                                    </span>
                                                )}
                                            </TableCell>

                                            {/* KYC */}
                                            <TableCell className="py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={`border-0 uppercase tracking-widest text-[8px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${
                                                        user.kyc_status === 'APPROVED'
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                                            : user.kyc_status === 'PENDING'
                                                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                                                            : user.kyc_status === 'REJECTED'
                                                            ? "bg-rose-50 text-rose-600 border border-rose-100"
                                                            : "bg-slate-50 text-slate-500 border border-slate-100"
                                                    }`}
                                                >
                                                    {user.kyc_status === 'APPROVED' && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                    {user.kyc_status === 'PENDING' && <Clock className="w-2.5 h-2.5" />}
                                                    {user.kyc_status === 'REJECTED' && <XCircle className="w-2.5 h-2.5" />}
                                                    {user.kyc_status || 'Not Submitted'}
                                                </Badge>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell className="py-4 text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="rounded-xl border border-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-[9px] font-black uppercase tracking-wider shadow-sm h-8 px-3"
                                                        onClick={() => { setSelectedUser(user); setViewDialog(true); }}
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1" /> View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl border-slate-100 text-[#000080] hover:text-[#000080] hover:bg-indigo-50 text-[9px] font-black uppercase tracking-wider shadow-sm h-8 px-3"
                                                        onClick={() => { setSelectedUser(user); setWalletDialog(true); }}
                                                    >
                                                        <CreditCard className="h-3.5 w-3.5 mr-1" /> Wallet
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Page {page} of {totalPages} · {totalCount} buyers
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="h-8 w-8 p-0 rounded-xl border-slate-100 shadow-sm"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page >= totalPages}
                                    className="h-8 w-8 p-0 rounded-xl border-slate-100 shadow-sm"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── View Buyer Detail Dialog ── */}
            <Dialog open={viewDialog} onOpenChange={setViewDialog}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-base font-black text-[#000080] uppercase tracking-wider flex items-center gap-2">
                            <User className="w-4 h-4" /> Buyer Profile
                        </DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                                <div className="h-14 w-14 rounded-2xl bg-white border border-indigo-100 text-[#000080] flex items-center justify-center font-black text-2xl shadow-sm">
                                    {(selectedUser.full_name || selectedUser.email || '?')[0].toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-800 text-sm">{selectedUser.full_name || 'Anonymous Buyer'}</h3>
                                    <p className="text-xs text-slate-500 font-medium">{selectedUser.email}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{selectedUser.id}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Phone", value: selectedUser.phone || '—', icon: '📱' },
                                    { label: "KYC Status", value: selectedUser.kyc_status || 'Not submitted', icon: '🛡️' },
                                    { label: "Wallet Balance", value: `₹${(selectedUser.wallets?.balance || 0).toLocaleString()}`, icon: '💳' },
                                    { label: "Locked Balance", value: `₹${(selectedUser.wallets?.locked_balance || 0).toLocaleString()}`, icon: '🔒' },
                                ].map(item => (
                                    <div key={item.label} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{item.icon} {item.label}</div>
                                        <div className="text-xs font-black text-slate-800 mt-1">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button
                                    className="flex-1 h-10 rounded-xl bg-[#000080] hover:bg-[#000080]/90 text-white text-[10px] font-black uppercase tracking-wider"
                                    onClick={() => { setViewDialog(false); setWalletDialog(true); }}
                                >
                                    <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Adjust Wallet
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 h-10 rounded-xl border-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider"
                                    onClick={() => setViewDialog(false)}
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* ── Wallet Adjustment Dialog ── */}
            <Dialog open={walletDialog} onOpenChange={setWalletDialog}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-base font-black text-[#000080] uppercase tracking-wider">Adjust Buyer Wallet</DialogTitle>
                        <DialogDescription className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                            Manually credit or debit shopping funds for{" "}
                            <span className="font-bold text-slate-700">{selectedUser?.full_name || selectedUser?.email}</span>.
                            Current balance:{" "}
                            <span className="font-black text-[#000080]">₹{(selectedUser?.wallets?.balance || 0).toLocaleString()}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjustment Type</Label>
                            <Select value={adjType} onValueChange={(v: any) => setAdjType(v)}>
                                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:ring-[#000080] font-bold text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-150 shadow-xl">
                                    <SelectItem value="CREDIT" className="font-bold text-emerald-600 py-3 text-xs">✅ Credit — Add Money</SelectItem>
                                    <SelectItem value="DEBIT" className="font-bold text-rose-600 py-3 text-xs">🔻 Debit — Remove Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</Label>
                            <Input
                                type="number"
                                value={adjAmount}
                                onChange={(e) => setAdjAmount(e.target.value)}
                                placeholder="0.00"
                                className="h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-sm font-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason</Label>
                            <Textarea
                                value={adjReason}
                                onChange={(e) => setAdjReason(e.target.value)}
                                placeholder="State reason for manual wallet adjustment..."
                                className="min-h-[80px] resize-none rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 gap-2">
                        <Button variant="ghost" onClick={() => setWalletDialog(false)} className="rounded-xl font-black text-[10px] uppercase tracking-wider text-slate-400 h-10 hover:bg-slate-50">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleWalletAdjustment}
                            disabled={submitting || !adjAmount || !adjReason}
                            className={`rounded-xl font-black text-[10px] uppercase tracking-wider h-10 px-6 text-white ${
                                adjType === 'CREDIT' ? 'bg-[#046A38] hover:bg-[#046A38]/90' : 'bg-rose-600 hover:bg-rose-700'
                            }`}
                        >
                            {submitting ? <PrePeSpinner className="h-4 w-4" /> : `Confirm ${adjType === 'CREDIT' ? 'Credit' : 'Debit'}`}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
