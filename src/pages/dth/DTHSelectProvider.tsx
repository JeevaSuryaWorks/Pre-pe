import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight, Sparkles, Tv, ShieldCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getOperators } from '@/services/operator.service';
import type { Operator } from '@/types/recharge.types';
import { PrepeLoader } from "@/components/ui/PrepeLoader";

// Animated space-themed DTH satellite signal banner
const DTHSignalAnimation = () => {
    return (
        <div className="w-full bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 rounded-3xl p-6 relative overflow-hidden shadow-xl border border-indigo-500/25 mb-2 mt-1">
            {/* Animated twinkling background stars */}
            <div className="absolute inset-0 opacity-40">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15%" cy="25%" r="1" fill="#fff" className="animate-ping" style={{ animationDuration: '3s' }} />
                    <circle cx="75%" cy="15%" r="1.5" fill="#fff" className="animate-ping" style={{ animationDuration: '4.5s' }} />
                    <circle cx="45%" cy="80%" r="1" fill="#fff" className="animate-ping" style={{ animationDuration: '2.5s' }} />
                    <circle cx="85%" cy="75%" r="1.2" fill="#fff" className="animate-ping" style={{ animationDuration: '3.5s' }} />
                </svg>
            </div>
            
            {/* Ambient Nebula Glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s' }} />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />

            <div className="flex items-center justify-between relative z-10 gap-6">
                <div className="space-y-2 max-w-[65%]">
                    <span className="text-[9px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/20 font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
                        Live Signal Feed
                    </span>
                    <h3 className="text-base font-black text-white leading-tight">BBPS Direct Connection</h3>
                    <p className="text-[11px] text-indigo-200/80 leading-normal font-semibold">
                        Instant account auto-verification and subscription status synchronization.
                    </p>
                </div>
                
                {/* SVG Signal transmission animation */}
                <div className="w-20 h-20 flex-shrink-0">
                    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        {/* Satellite dish */}
                        <g className="animate-bounce" style={{ animationDuration: '4s' }}>
                            <path d="M15 75 C15 55, 35 35, 55 35" stroke="url(#satelliteGrad)" strokeWidth="3" strokeLinecap="round" />
                            <path d="M22 68 L28 74" stroke="#818cf8" strokeWidth="2.5" />
                            {/* Base support */}
                            <path d="M10 80 L30 80 M20 80 L20 73" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" />
                            {/* Receiver head */}
                            <circle cx="58" cy="33" r="3" fill="#06b6d4" className="animate-pulse" />
                            <path d="M47 43 L56 35" stroke="#38bdf8" strokeWidth="1.5" />
                        </g>

                        {/* Animated signal transmission beams */}
                        <path d="M60 40 Q75 45, 80 60" stroke="#818cf8" strokeWidth="2" strokeDasharray="4 4" strokeLinecap="round" className="animate-signal-beam-1" />
                        <path d="M65 35 Q83 43, 85 62" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" className="animate-signal-beam-2" />

                        {/* Television */}
                        <g className="animate-pulse" style={{ animationDuration: '3s' }}>
                            {/* TV outer frame */}
                            <rect x="68" y="65" width="26" height="20" rx="3" fill="#1e1b4b" stroke="url(#tvGrad)" strokeWidth="2.5" />
                            {/* TV screen */}
                            <rect x="72" y="68" width="18" height="13" rx="1.5" fill="#312e81" />
                            {/* TV antenna */}
                            <path d="M76 60 L81 65 M86 60 L81 65" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" />
                            <circle cx="76" cy="59" r="1.5" fill="#38bdf8" />
                            <circle cx="86" cy="59" r="1.5" fill="#38bdf8" />
                            {/* Play icon inside screen */}
                            <path d="M79 72 L85 75 L79 78 Z" fill="#38bdf8" />
                        </g>

                        {/* Gradients */}
                        <defs>
                            <linearGradient id="satelliteGrad" x1="15" y1="75" x2="55" y2="35" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="100%" stopColor="#38bdf8" />
                            </linearGradient>
                            <linearGradient id="tvGrad" x1="68" y1="65" x2="94" y2="85" gradientUnits="userSpaceOnUse">
                                <stop offset="0%" stopColor="#818cf8" />
                                <stop offset="100%" stopColor="#c084fc" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
            </div>
            
            {/* Custom signal animation style injected inline */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes signal-flow-1 {
                    0% { stroke-dashoffset: 20; opacity: 0.3; }
                    50% { opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 0.3; }
                }
                @keyframes signal-flow-2 {
                    0% { stroke-dashoffset: 15; opacity: 0.2; }
                    50% { opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 0.2; }
                }
                .animate-signal-beam-1 {
                    animation: signal-flow-1 2s linear infinite;
                }
                .animate-signal-beam-2 {
                    animation: signal-flow-2 1.5s linear infinite;
                }
            `}} />
        </div>
    );
};

// Animated Signal Strength Bars (representing DTH signal connection)
const SignalStrengthIndicator = () => {
    return (
        <svg className="w-4 h-3.5 text-emerald-500 flex-shrink-0" viewBox="0 0 24 18" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="12" width="4" height="6" rx="1" className="animate-pulse" style={{ animationDuration: '1.2s', animationDelay: '0s' }} />
            <rect x="6" y="8" width="4" height="10" rx="1" className="animate-pulse" style={{ animationDuration: '1.2s', animationDelay: '0.2s' }} />
            <rect x="12" y="4" width="4" height="14" rx="1" className="animate-pulse" style={{ animationDuration: '1.2s', animationDelay: '0.4s' }} />
            <rect x="18" y="0" width="4" height="18" rx="1" className="animate-pulse" style={{ animationDuration: '1.2s', animationDelay: '0.6s' }} />
        </svg>
    );
};

export const DTHSelectProvider = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [operators, setOperators] = useState<Operator[]>([]);
    const [recentProviders, setRecentProviders] = useState<Operator[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const loadOps = async () => {
            setLoading(true);
            const ops = await getOperators('dth');
            setOperators(ops);
            // Simulate recent providers
            setRecentProviders(ops.slice(0, 3));
            setLoading(false);
        };
        loadOps();
    }, []);

    const filteredOperators = operators.filter(op =>
        op.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleProviderClick = (provider: Operator) => {
        navigate(`/dth-recharge/enter-details?operator=${provider.id}`, { state: location.state });
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
                    <div className="flex items-center gap-2 bg-indigo-50 text-indigo-650 border border-indigo-100/80 px-3.5 py-1.5 rounded-full text-[10px] font-black w-fit animate-pulse shadow-sm tracking-wider">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-spin" style={{ animationDuration: '3s' }} />
                        <span>BBPS SECURE DIRECT DTH RECHARGE</span>
                    </div>

                    {/* Branding Intro */}
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                            <Tv className="h-6 w-6 text-indigo-600 animate-bounce" /> Choose DTH Operator
                        </h2>
                        <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
                            INSTANT CREDIT & SUBSCRIPTION AUTO-ACTIVATION
                        </p>
                    </div>

                    {/* DTH Signal Transmission Banner */}
                    <DTHSignalAnimation />

                    {/* Search Bar Container */}
                    <div className="relative group transition-all duration-300">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 transition-transform group-focus-within:scale-110" />
                        <Input
                            placeholder="Search DTH operator name..."
                            className="pl-12 pr-4 h-14 bg-white/95 border border-slate-150 rounded-2xl shadow-sm text-slate-900 group-focus-within:border-indigo-500 group-focus-within:ring-4 group-focus-within:ring-indigo-500/10 transition-all text-base placeholder:text-slate-400 font-semibold"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="py-12 bg-white/60 backdrop-blur-md rounded-[32px] border border-slate-100/50 shadow-sm">
                            <PrepeLoader text="Syncing Operators..." size="md" />
                        </div>
                    ) : (
                        <>
                            {/* Recent Providers */}
                            {!searchQuery && recentProviders.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Recently Used</h3>
                                        <span className="text-[9px] bg-indigo-50 text-indigo-600 font-black px-2 py-0.5 rounded-full border border-indigo-100">QUICK</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {recentProviders.map(provider => (
                                            <div
                                                key={`recent-${provider.id}`}
                                                className="flex flex-col items-center justify-center bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-300 cursor-pointer text-center group shadow-sm"
                                                onClick={() => handleProviderClick(provider)}
                                            >
                                                <div className="h-14 w-14 p-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:border-indigo-200 overflow-hidden shadow-inner">
                                                    {provider.logo ? (
                                                        <img src={provider.logo} alt={provider.name} className="h-full w-full object-contain" />
                                                    ) : (
                                                        <span className="text-lg font-black bg-indigo-50 text-indigo-600 h-full w-full flex items-center justify-center rounded-xl">{provider.name.substring(0, 2).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <span className="text-[11px] font-black text-slate-700 mt-2.5 truncate w-full group-hover:text-indigo-600 transition-colors leading-none">{provider.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* All Providers */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 px-1">All DTH Providers</h3>
                                <div className="space-y-3">
                                    {filteredOperators.length > 0 ? (
                                        filteredOperators.map(provider => (
                                            <div
                                                key={provider.id}
                                                className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-white hover:shadow-md active:scale-[0.99] transition-all duration-300 cursor-pointer group shadow-sm"
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
                                                        <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase mt-1 flex items-center gap-1.5">
                                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> SECURE BBPS GATEWAY
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {/* Custom Signal indicator showing connection strength */}
                                                    <SignalStrengthIndicator />
                                                    
                                                    {/* Animated Action Arrow */}
                                                    <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-100 group-hover:border-indigo-200 group-hover:bg-indigo-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-all duration-300 shadow-sm">
                                                        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 bg-white/60 rounded-3xl border border-dashed border-slate-200 shadow-sm">
                                            <div className="text-4xl mb-2 animate-bounce">🔍</div>
                                            <p className="text-sm text-slate-500 font-bold">No DTH operators found matching "{searchQuery}"</p>
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
