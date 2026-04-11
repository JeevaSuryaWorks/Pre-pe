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
import { Loader2, Search, CreditCard, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const PaidUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [planFilter, setPlanFilter] = useState<string>("PRO"); // Default to PRO

    useEffect(() => {
        fetchPaidUsers();
    }, [page, search, planFilter]);

    const fetchPaidUsers = async () => {
        setLoading(true);
        try {
            // We fetch users filtered by planType
            const { data } = await adminService.getUsers(page, 50, search, planFilter);
            setUsers(data || []);
        } catch (e) {
            toast.error("Failed to load paid users");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Paid Subscribers</h2>
                    <p className="text-slate-500 mt-1">Manage users who have active premium subscriptions.</p>
                </div>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200">
                    <Button 
                        variant={planFilter === 'PRO' ? 'default' : 'ghost'} 
                        onClick={() => setPlanFilter('PRO')}
                        className="rounded-lg h-9 px-4 font-semibold"
                    >
                        Pro Users
                    </Button>
                    <Button 
                        variant={planFilter === 'BUSINESS' ? 'default' : 'ghost'} 
                        onClick={() => setPlanFilter('BUSINESS')}
                        className="rounded-lg h-9 px-4 font-semibold"
                    >
                        Business Users
                    </Button>
                </div>
            </div>

            <div className="flex w-full md:max-w-md items-center space-x-2 bg-white rounded-xl shadow-sm border border-slate-200 p-1">
                <Search className="h-5 w-5 text-slate-400 ml-2" />
                <Input
                    placeholder="Search by name, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 px-2"
                />
            </div>

            <Card className="border-slate-200 shadow-xl bg-white overflow-hidden rounded-2xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b">
                            <TableRow>
                                <TableHead className="py-4 font-bold text-slate-600">User</TableHead>
                                <TableHead className="py-4 font-bold text-slate-600">Plan</TableHead>
                                <TableHead className="py-4 font-bold text-slate-600">Wallet</TableHead>
                                <TableHead className="py-4 font-bold text-slate-600">Joined</TableHead>
                                <TableHead className="py-4 font-bold text-slate-600 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-slate-400">
                                        No paid users found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="py-4">
                                            <div className="font-bold text-slate-900">{user.full_name || 'Anonymous'}</div>
                                            <div className="text-xs text-slate-500 font-medium">{user.email}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge className={planFilter === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                                                {user.plan_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 font-bold text-slate-700">
                                            ₹{user.wallets?.balance?.toLocaleString() || 0}
                                        </TableCell>
                                        <TableCell className="py-4 text-slate-500 text-sm">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="py-4 text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="rounded-lg text-blue-600 font-bold"
                                                onClick={() => navigate(`/admin/users`)} // Redirect to user management for actions
                                            >
                                                Details <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default PaidUsers;
