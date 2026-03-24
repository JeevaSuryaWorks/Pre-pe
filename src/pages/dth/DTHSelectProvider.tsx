
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { getOperators } from '@/services/operator.service';
import type { Operator } from '@/types/recharge.types';

export const DTHSelectProvider = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [operators, setOperators] = useState<Operator[]>([]);
    const [recentProviders, setRecentProviders] = useState<Operator[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        const loadOps = async () => {
            const ops = await getOperators('dth');
            setOperators(ops);
            // Simulate recent providers (take first 3 for demo)
            setRecentProviders(ops.slice(0, 3));
        };
        loadOps();
    }, []);

    const filteredOperators = operators.filter(op =>
        op.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleProviderClick = (provider: Operator) => {
        navigate(`/dth-recharge/enter-details?operator=${provider.id}`);
    };

    return (
        <Layout title="Select Provider" showBack>
            <div className="bg-slate-50 min-h-screen pb-20">
                {/* Bharat Connect Header Logic removed due to 307 infinite redirect loop */}

                <div className="p-4 space-y-6">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by Provider's Name"
                            className="pl-9 h-12 bg-white border-gray-200 rounded-xl shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Recent Providers */}
                    {!searchQuery && recentProviders.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-slate-700">Recent Providers</h3>
                            <div className="space-y-3">
                                {recentProviders.map(provider => (
                                    <div
                                        key={`recent-${provider.id}`}
                                        className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => handleProviderClick(provider)}
                                    >
                                        <Avatar className="h-10 w-10 p-1 bg-white border rounded-full">
                                            <AvatarImage src={provider.logo || ''} className="object-contain" />
                                            <AvatarFallback>{provider.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium text-slate-700">{provider.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Providers */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-slate-700">All Provider</h3>
                        <div className="space-y-3">
                            {filteredOperators.map(provider => (
                                <div
                                    key={provider.id}
                                    className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => handleProviderClick(provider)}
                                >
                                    <Avatar className="h-10 w-10 p-1 bg-white border rounded-full">
                                        <AvatarImage src={provider.logo || ''} className="object-contain" />
                                        <AvatarFallback>{provider.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium text-slate-700">{provider.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
