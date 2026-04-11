import { Home, Heart, BadgePercent, History, SlidersHorizontal } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to determine if a path is active. We handle sub-routes like `/vouchers` as well.
    const isActive = (path: string) => {
        if (path === '/home') return location.pathname === '/home';
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { icon: Home, label: "Home", path: "/home" },
        { icon: Heart, label: "Saved", path: "/saved" },
        { icon: BadgePercent, label: "Rewards", path: "/rewards" },
        { icon: History, label: "History", path: "/transactions" },
        { icon: SlidersHorizontal, label: "Profile", path: "/profile" },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
            <div className="w-full max-w-md pointer-events-auto">
                <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.04)] px-4 py-3 pb-safe-area-bottom">
                    <div className="flex justify-between items-center px-1">
                        {navItems.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={cn(
                                        "flex items-center justify-center transition-all duration-500 ease-out h-12",
                                        active ? "bg-[#28A745]/10 rounded-full px-5" : "bg-transparent rounded-full px-3 hover:bg-slate-50 w-12"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <item.icon
                                            className={cn(
                                                "w-[22px] h-[22px] transition-colors duration-500",
                                                active ? "text-[#28A745]" : "text-slate-400"
                                            )}
                                            fill={active ? "#28A745" : "transparent"}
                                            fillOpacity={active ? 0.2 : 0}
                                            strokeWidth={active ? 2.5 : 2}
                                        />
                                        
                                        {/* Expandable Text Container */}
                                        <div 
                                            className={cn(
                                                "overflow-hidden transition-all duration-500",
                                                active ? "max-w-[100px] opacity-100 ml-0.5" : "max-w-0 opacity-0"
                                            )}
                                        >
                                            <span className="text-[#28A745] font-extrabold text-[13px] tracking-tight whitespace-nowrap">
                                                {item.label}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
