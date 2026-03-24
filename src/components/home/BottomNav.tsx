import { Home, FileText, User, Wallet, Grid } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    const navItems = [
        { icon: Home, label: "Home", path: "/home" },
        { icon: Wallet, label: "Services", path: "/mobile-recharge" },
        { icon: FileText, label: "History", path: "/transactions" },
        { icon: User, label: "Profile", path: "/profile" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            {/* 
              Constrain width to match the app layout (max-w-md). 
              pointer-events-auto re-enables clicks.
            */}
            <div className="w-full max-w-md pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] px-6 py-3 pb-safe-area-bottom">
                    <div className="flex justify-between items-center">
                        {navItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "relative flex flex-col items-center justify-center gap-1 transition-all duration-300 w-16 group",
                                        active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {/* Active Indicator Splash */}
                                    {active && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-b-full shadow-lg shadow-blue-600/20" />
                                    )}

                                    <div className={cn(
                                        "relative p-1.5 rounded-xl transition-all duration-300",
                                        active ? "bg-blue-50" : "bg-transparent group-hover:bg-slate-50"
                                    )}>
                                        <item.icon
                                            className={cn(
                                                "w-6 h-6 transition-all duration-300",
                                                active ? "fill-blue-600 text-blue-600" : "fill-transparent"
                                            )}
                                            strokeWidth={active ? 2 : 2}
                                        />
                                    </div>
                                    <span className={cn(
                                        "text-[10px] font-bold tracking-wide transition-all duration-300",
                                        active ? "translate-y-0 opacity-100" : "translate-y-0.5 opacity-80"
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
