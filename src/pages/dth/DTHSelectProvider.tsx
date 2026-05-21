import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Sparkles, Tv, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getOperators } from '@/services/operator.service';
import type { Operator } from '@/types/recharge.types';

export const DTHSelectProvider = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [operators, setOperators] = useState<Operator[]>([]);
    const [recentProviders, setRecentProviders] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const loadOps = async () => {
            setLoading(true);
            const ops = await getOperators('dth');
            setOperators(ops);
            // Simulate recent providers (take first 3 for demo)
            setRecentProviders(ops.slice(0, 3));
            setLoading(false);
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
        <Layout title="Select Operator" showBack>
            <div className="relative bg-[#f8fbfe] min-h-screen pb-24 overflow-hidden text-slate-850 font-sans select-none">
                {/* Decorative Premium Glow Background Blobs */}
                <div className="absolute top-[-10%] left-[-20%] w-[350px] h-[350px] bg-gradient-to-br from-indigo-200/30 via-purple-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] bg-gradient-to-br from-emerald-100/20 via-teal-50/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                {/* Bharat Connect Header */}
                <div className="absolute top-4 right-4 z-50 transition-all duration-300 hover:opacity-100 opacity-90">
                    <img
                        src="/bharat-connect.svg" 
                        alt="Bharat Connect"
                        className="h-7 w-auto object-contain drop-shadow-sm"
                    />
                </div>

                <div className="p-4 space-y-6 max-w-md mx-auto relative z-10 pt-6">
                    {/* Visual Intro Badge */}
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 border border-indigo-100/85 px-3.5 py-1.5 rounded-full text-xs font-black w-fit animate-pulse shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>BBPS SECURE DIRECT DTH RECHARGE</span>
                    </div>

                    {/* Branding Intro */}
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <Tv className="h-6 w-6 text-indigo-500 animate-bounce" /> Choose DTH Operator
                        </h2>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            Instant credit & subscription auto-activation
                        </p>
                    </div>

                    {/* Search Bar Container */}
                    <div className="relative group transition-all duration-300">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-550 transition-transform group-focus-within:scale-110" />
                        <Input
                            placeholder="Search DTH operator name..."
                            className="pl-12 pr-4 h-14 bg-white/90 border-slate-200 rounded-2xl shadow-sm text-slate-900 group-focus-within:border-indigo-500 group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 transition-all text-base placeholder:text-slate-400 font-semibold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            <span className="text-xs text-slate-505 font-bold tracking-widest uppercase animate-pulse">Syncing Operators...</span>
                        </div>
                    ) : (
                        <>
                            {/* Recent Providers */}
                            {!searchQuery && recentProviders.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-450">Recently Used</h3>
                                        <span className="text-[9px] bg-indigo-50 text-indigo-600 font-black px-2 py-0.5 rounded-full border border-indigo-100">QUICK</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {recentProviders.map(provider => (
                                            <div
                                                key={`recent-${provider.id}`}
                                                className="flex flex-col items-center justify-center bg-white/90 backdrop-blur-md p-4 rounded-2.5xl border border-slate-100 hover:border-indigo-300 hover:bg-white hover:shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer text-center group shadow-sm"
                                                onClick={() => handleProviderClick(provider)}
                                            >
                                                <div className="h-14 w-14 p-2 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-300 overflow-hidden shadow-inner">
                                                    {provider.logo ? (
                                                        <img src={provider.logo} alt={provider.name} className="h-full w-full object-contain" />
                                                    ) : (
                                                        <span className="text-lg font-black bg-indigo-50 text-indigo-600 h-full w-full flex items-center justify-center rounded-xl">{provider.name.substring(0, 2).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-black text-slate-700 mt-2.5 truncate w-full group-hover:text-indigo-600 transition-colors">{provider.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Providers */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-450 px-1">All DTH Providers</h3>
                                <div className="space-y-3">
                                    {filteredOperators.length > 0 ? (
                                        filteredOperators.map(provider => (
                                            <div
                                                key={provider.id}
                                                className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2.5xl border border-slate-100 hover:border-indigo-300 hover:bg-white active:scale-[0.99] transition-all duration-300 cursor-pointer group shadow-sm"
                                                onClick={() => handleProviderClick(provider)}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-13 w-13 p-2 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 overflow-hidden shadow-inner">
                                                        {provider.logo ? (
                                                            <img src={provider.logo} alt={provider.name} className="h-full w-full object-contain" />
                                                        ) : (
                                                            <span className="text-sm font-black bg-indigo-50 text-indigo-600 h-full w-full flex items-center justify-center rounded-xl">{provider.name.substring(0, 2).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{provider.name}</span>
                                                        <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1 flex items-center gap-1">
                                                            <ShieldCheck className="h-3 w-3 text-emerald-500" /> SECURE BBPS GATEWAY
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 group-hover:border-indigo-200 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all duration-300 shadow-sm">
                                                    <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-white/60 rounded-3xl border border-dashed border-slate-200 shadow-sm">
                                            <div className="text-4xl mb-2 animate-bounce">🔍</div>
                                            <p className="text-sm text-slate-550 font-bold">No DTH operators found matching "{searchQuery}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};
