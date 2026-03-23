import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, ArrowDownLeft, ArrowUpRight, Lock, History, Search, Filter, Download, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from 'react';
import { getWalletLedger } from '@/services/wallet.service';
import { format } from 'date-fns';

interface LedgerEntry {
    id: string;
    type: string;
    amount: number;
    balance_after: number;
    description: string;
    created_at: string;
    status?: string;
}

const LedgerPage = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [filteredLedger, setFilteredLedger] = useState<LedgerEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    useEffect(() => {
        const loadLedger = async () => {
            if (user) {
                setIsLoading(true);
                const entries = await getWalletLedger(user.id, 100);
                setLedger(entries);
                setFilteredLedger(entries);
                setIsLoading(false);
            }
        };
        loadLedger();
    }, [user]);

    useEffect(() => {
        let result = ledger;

        if (typeFilter !== 'ALL') {
            result = result.filter(entry => entry.type === typeFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(entry =>
                entry.description.toLowerCase().includes(query) ||
                entry.id.toLowerCase().includes(query)
            );
        }

        setFilteredLedger(result);
    }, [ledger, searchQuery, typeFilter]);


    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'CREDIT':
                return <ArrowDownLeft className="h-4 w-4 text-emerald-600" />;
            case 'DEBIT':
                return <ArrowUpRight className="h-4 w-4 text-red-600" />;
            case 'LOCK':
                return <Lock className="h-4 w-4 text-slate-500" />;
            case 'UNLOCK':
            case 'REFUND':
                return <ArrowDownLeft className="h-4 w-4 text-blue-600" />;
            default:
                return <History className="h-4 w-4 text-slate-500" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'CREDIT':
                return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Credit</Badge>;
            case 'DEBIT':
                return <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Debit</Badge>;
            case 'LOCK':
                return <Badge variant="outline" className="text-slate-600">Locked</Badge>;
            case 'UNLOCK':
                return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">Unlock</Badge>;
            case 'REFUND':
                return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">Refund</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="container py-8 flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </Layout>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace />;
    }

    return (
        <Layout title="Ledger">
            <div className="container py-8 pb-32 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="h-10 w-10 -ml-2 rounded-full" onClick={() => navigate(-1)}>
                            <ChevronLeft className="h-6 w-6 text-slate-500" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">Wallet Ledger</h1>
                            <p className="text-slate-500 mt-1">Comprehensive history of all your digital wallet transactions.</p>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row gap-3 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-9 w-full bg-slate-50 border-slate-200 focus:bg-white transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-full sm:w-[150px] bg-slate-50 border-slate-200">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Types</SelectItem>
                                <SelectItem value="CREDIT">Credits</SelectItem>
                                <SelectItem value="DEBIT">Debits</SelectItem>
                                <SelectItem value="REFUND">Refunds</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon" className="shrink-0 border-slate-200">
                            <Download className="h-4 w-4 text-slate-600" />
                        </Button>
                    </div>
                </div>

                {/* Ledger List - New Clean Design */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="hidden md:grid grid-cols-[2.5fr_1fr_1.5fr_1.5fr] gap-4 border-b border-slate-100 bg-slate-50/50 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider px-6">
                        <div>Description</div>
                        <div>Type</div>
                        <div>Date</div>
                        <div className="text-right">Amount</div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {isLoading ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : filteredLedger.length === 0 ? (
                            <div className="py-16 text-center text-slate-500">
                                <History className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No transactions found matching your criteria</p>
                            </div>
                        ) : (
                            filteredLedger.map((entry) => (
                                <div key={entry.id} className="group flex flex-col md:grid md:grid-cols-[2.5fr_1fr_1.5fr_1.5fr] gap-3 md:gap-4 items-center p-4 md:px-6 hover:bg-slate-50 transition-colors">
                                    {/* Description Mobile/Desktop */}
                                    <div className="w-full flex items-center gap-3 min-w-0">
                                        <div className={`shrink-0 p-2.5 rounded-xl ${entry.type === 'CREDIT' || entry.type === 'REFUND' ? 'bg-emerald-100/50 text-emerald-600' : 'bg-red-100/50 text-red-600'}`}>
                                            {getTypeIcon(entry.type)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-slate-900 line-clamp-2 leading-tight" title={entry.description}>{entry.description}</p>
                                            <p className="text-xs text-slate-400 font-mono visible md:hidden mt-0.5">
                                                {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Type Badge */}
                                    <div className="w-full flex md:block pl-12 md:pl-0 -mt-2 md:mt-0">
                                        <div className="w-fit scale-90 origin-left md:scale-100">
                                            {getTypeBadge(entry.type)}
                                        </div>
                                    </div>

                                    {/* Date Desktop */}
                                    <div className="hidden md:block text-sm text-slate-500 font-medium whitespace-nowrap">
                                        {format(new Date(entry.created_at), 'MMM d, yyyy')}
                                        <span className="block text-xs text-slate-400 mt-0.5">{format(new Date(entry.created_at), 'h:mm a')}</span>
                                    </div>

                                    {/* Amount & Balance */}
                                    <div className="w-full text-right pl-12 md:pl-0 -mt-2 md:mt-0">
                                        <p className={`font-bold text-base ${entry.type === 'CREDIT' || entry.type === 'REFUND' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                            {entry.type === 'CREDIT' || entry.type === 'REFUND' ? '+' : '-'}₹{entry.amount.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                                            Bal: ₹{entry.balance_after.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default LedgerPage;
