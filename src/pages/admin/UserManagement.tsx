import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Loader2, Search, Ban, CheckCircle, CreditCard, History, MoreVertical, Star } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const UserManagement = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [walletDialog, setWalletDialog] = useState(false);

    // Wallet Adjustment Form
    const [adjType, setAdjType] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
    const [adjAmount, setAdjAmount] = useState("");
    const [adjReason, setAdjReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Spin Limit Form
    const [spinLimitDialog, setSpinLimitDialog] = useState(false);
    const [customSpinLimit, setCustomSpinLimit] = useState("");


    useEffect(() => {
        fetchUsers();
    }, [page, search]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await adminService.getUsers(page, 20, search);
            setUsers(data || []);
        } catch (e) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    const handleWalletAdjustment = async () => {
        if (!selectedUser || !adjAmount || !adjReason) return;
        setSubmitting(true);
        try {
            await adminService.adjustWallet(selectedUser.user_id, adjType, Number(adjAmount), adjReason);
            toast.success("Wallet adjusted successfully");
            setWalletDialog(false);
            fetchUsers();
            setAdjAmount("");
            setAdjReason("");
        } catch (e: any) {
            toast.error(e.message || "Adjustment failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSpinLimitUpdate = async () => {
        if (!selectedUser) return;
        setSubmitting(true);
        try {
            const limitVal = customSpinLimit === "" ? null : parseInt(customSpinLimit);
            await adminService.updateProfile(selectedUser.user_id, { custom_spin_limit: limitVal });
            toast.success("Spin limit updated successfully");
            setSpinLimitDialog(false);
            fetchUsers();
        } catch (e: any) {
            toast.error(e.message || "Failed to update limit");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">User Management</h2>
                    <p className="text-slate-500 mt-1">View and manage all registered accounts on the platform.</p>
                </div>
                <div className="flex w-full md:max-w-md items-center space-x-2 bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                    <Search className="h-5 w-5 text-slate-400 ml-2 animate-pulse" />
                    <Input
                        placeholder="Search by name, email, phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
                    />
                    <Button onClick={() => fetchUsers()} className="rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">
                        Search
                    </Button>
                </div>
            </div>

            <Card className="border-slate-200/60 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap">User Details</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap">Wallet Balance</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap">Status</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap">Joined Date</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs text-right whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                                                <p>Loading users...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-48 text-center text-slate-500">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                                                        {(user.full_name || user.email || '?')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{user.full_name || 'Anonymous User'}</div>
                                                        <div className="text-sm text-slate-500 font-medium">{user.email}</div>
                                                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">{user.phone || 'No phone'}</div>
                                                        {user.custom_spin_limit !== null && (
                                                            <Badge variant="outline" className="mt-1 bg-indigo-50 text-indigo-700 border-indigo-200 text-[9px] px-1.5 py-0 uppercase">
                                                                Spins: {user.custom_spin_limit}/day
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="font-black text-lg text-slate-900">₹{(user.wallets?.balance || 0).toLocaleString()}</div>
                                                {user.wallets?.locked_balance > 0 && (
                                                    <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                                                        Locked: ₹{user.wallets.locked_balance}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex flex-col gap-2 w-fit">
                                                    <Badge
                                                        variant="outline"
                                                        className={`border-0 uppercase tracking-widest text-[9px] font-bold px-2 py-0.5 ${user.kyc_status === 'APPROVED' ? "bg-emerald-100 text-emerald-700" :
                                                                user.kyc_status === 'PENDING' ? "bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer transition-colors" :
                                                                    "bg-slate-100 text-slate-600"
                                                            }`}
                                                    >
                                                        {user.kyc_status || 'NOT SUBMITTED'}
                                                    </Badge>
                                                    <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-0 uppercase tracking-widest text-[9px] font-bold px-2 py-0.5 w-fit">
                                                        ACTIVE
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 text-slate-600 font-medium text-sm whitespace-nowrap">
                                                {new Date(user.created_at).toLocaleDateString(undefined, {
                                                    day: 'numeric', month: 'short', year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl border-slate-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors shadow-sm"
                                                        onClick={() => { setSelectedUser(user); setWalletDialog(true); }}
                                                    >
                                                        <CreditCard className="h-4 w-4 mr-1.5" /> Adjust Balance
                                                    </Button>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="outline" size="sm" className="rounded-xl border-slate-200 shadow-sm w-9 px-0">
                                                                <MoreVertical className="h-4 w-4 text-slate-600" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl">
                                                            <DropdownMenuItem 
                                                                className="cursor-pointer font-medium py-2 text-indigo-600"
                                                                onClick={() => { 
                                                                    setSelectedUser(user); 
                                                                    setCustomSpinLimit(user.custom_spin_limit !== null ? String(user.custom_spin_limit) : ""); 
                                                                    setSpinLimitDialog(true); 
                                                                }}
                                                            >
                                                                <Star className="h-4 w-4 mr-2" /> Spin Limits
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Wallet Adjustment Dialog */}
            <Dialog open={walletDialog} onOpenChange={setWalletDialog}>
                <DialogContent className="sm:max-w-md rounded-[24px] border-none shadow-2xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">Wallet Adjustment</DialogTitle>
                        <DialogDescription className="text-slate-500 mt-2 leading-relaxed">
                            Manually credit or debit funds for <span className="font-bold text-slate-700">{selectedUser?.full_name || selectedUser?.email}</span>. This action is permanently logged.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjustment Type</Label>
                            <Select value={adjType} onValueChange={(v: any) => setAdjType(v)}>
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500 font-semibold">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl overflow-hidden border-slate-200 shadow-xl">
                                    <SelectItem value="CREDIT" className="font-semibold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 py-3">Credit (Add Money)</SelectItem>
                                    <SelectItem value="DEBIT" className="font-semibold text-rose-600 focus:bg-rose-50 focus:text-rose-700 py-3">Debit (Remove Money)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (₹)</Label>
                            <Input
                                type="number"
                                value={adjAmount}
                                onChange={(e) => setAdjAmount(e.target.value)}
                                placeholder="0.00"
                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-colors font-bold text-lg"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reason</Label>
                            <Textarea
                                value={adjReason}
                                onChange={(e) => setAdjReason(e.target.value)}
                                placeholder="Required for compliance/audit logs..."
                                className="min-h-[100px] resize-none rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-colors font-medium"
                            />
                        </div>
                    </div>
                    <DialogFooter className="mt-6 gap-3 sm:gap-0">
                        <Button variant="ghost" onClick={() => setWalletDialog(false)} className="rounded-xl font-semibold text-slate-500 h-11 hover:bg-slate-100">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleWalletAdjustment}
                            disabled={submitting || !adjAmount || !adjReason}
                            className={`rounded-xl font-bold h-11 px-6 shadow-md transition-all ${adjType === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                                }`}
                        >
                            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Confirm Adjustment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Spin Limit Dialog */}
            <Dialog open={spinLimitDialog} onOpenChange={setSpinLimitDialog}>
                <DialogContent className="sm:max-w-sm rounded-[24px] border-none shadow-2xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">User Spin Limit</DialogTitle>
                        <DialogDescription className="text-slate-500 mt-2 leading-relaxed">
                            Override the default plan spin limit for <span className="font-bold text-slate-700">{selectedUser?.full_name || selectedUser?.email}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Daily Limit</Label>
                            <Input
                                type="number"
                                min="0"
                                value={customSpinLimit}
                                onChange={(e) => setCustomSpinLimit(e.target.value)}
                                placeholder="Leave blank for Plan Default"
                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 transition-colors font-bold text-lg"
                            />
                            <p className="text-[10px] text-slate-400 font-medium italic">If blank, the user's base plan limit will be used.</p>
                        </div>
                    </div>
                    <DialogFooter className="mt-6 gap-3 sm:gap-0">
                        <Button variant="ghost" onClick={() => setSpinLimitDialog(false)} className="rounded-xl font-semibold text-slate-500 h-11 hover:bg-slate-100">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSpinLimitUpdate}
                            disabled={submitting}
                            className="rounded-xl font-bold h-11 px-6 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all"
                        >
                            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Save Limit"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserManagement;
