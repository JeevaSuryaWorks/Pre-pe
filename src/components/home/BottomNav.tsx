import { Home, Heart, BadgePercent, Zap, SlidersHorizontal, Bot, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to determine if a path is active.
    const isActive = (path: string) => {
        if (path === '/home') return location.pathname === '/home';
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { icon: Home, label: "Home", path: "/home" },
        { icon: Heart, label: "Saved", path: "/saved" },
        { icon: BadgePercent, label: "Rewards", path: "/rewards" },
        { icon: Bot, label: "AI Chat", path: "/ai-chat", isAI: true },
        { icon: Zap, label: "Upgrade", path: "/upgrade" },
        { icon: Settings, label: "Settings", path: "/profile" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="w-full max-w-md pointer-events-auto relative">
                
                {/* Main Navigation Bar */}
                <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] px-2 py-2 pb-safe-area-bottom">
                    <div className="grid grid-cols-6 items-end gap-1">
                        {navItems.map((item, index) => {
                            const active = isActive(item.path);
                            
                            if (item.isAI) {
                                return (
                                    <div key={item.path} className="relative flex justify-center h-12">
                                        <button
                                            onClick={() => navigate(item.path)}
                                            className={cn(
                                                "absolute bottom-4 flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-xl",
                                                active 
                                                    ? "bg-blue-600 scale-110 shadow-blue-600/40" 
                                                    : "bg-slate-800 hover:bg-slate-700 shadow-slate-900/20"
                                            )}
                                        >
                                            <item.icon className="w-7 h-7 text-white" />
                                            {active && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                                            )}
                                        </button>
                                        <span className={cn(
                                            "absolute -bottom-1 text-[10px] font-bold uppercase tracking-tight transition-colors whitespace-nowrap",
                                            active ? "text-blue-600" : "text-slate-400"
                                        )}>
                                            AI
                                        </span>
                                    </div>
                                );
                            }

                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="flex flex-col items-center justify-center h-12 gap-1 group transition-all"
                                >
                                    <div className={cn(
                                        "p-1.5 rounded-xl transition-all duration-300",
                                        active ? "bg-emerald-50 text-emerald-600 scale-110" : "text-slate-400 group-hover:text-slate-600"
                                    )}>
                                        <item.icon
                                            className="w-5 h-5"
                                            strokeWidth={active ? 2.5 : 2}
                                            fill={active ? "currentColor" : "none"}
                                            fillOpacity={active ? 0.1 : 0}
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-bold uppercase tracking-tighter transition-colors",
                                        active ? "text-emerald-600" : "text-slate-400"
                                    )}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
