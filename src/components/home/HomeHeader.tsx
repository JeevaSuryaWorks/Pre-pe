import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useWallet } from "@/hooks/useWallet";
import { useKYC } from "@/hooks/useKYC";
import { useProfile } from "@/hooks/useProfile";

export const HomeHeader = () => {
    const { user } = useAuth();
    const { profile } = useProfile();
    const { availableBalance, loading } = useWallet();
    const { isApproved } = useKYC();

    const network = profile?.sim_provider || user?.user_metadata?.sim_provider || "Airtel";
    const phone = user?.phone || user?.user_metadata?.phone || "8668075429";
    const name = user?.user_metadata?.full_name || "Boopathi Raja";
    const fallbackChar = name.charAt(0).toUpperCase();

    const displayBalance = () => {
        if (loading) return "...";
        if (!isApproved) return "****.**";
        return availableBalance.toFixed(2);
    };

    return (
        <div className="flex items-center justify-between px-4 py-4 bg-white/50 backdrop-blur-md sticky top-0 z-50">
            {/* Left User Profile */}
            <div className="flex items-center gap-3">
                <Link to="/profile">
                    <Avatar className="h-12 w-12 border border-white shadow-sm ring-2 ring-orange-500">
                        <AvatarImage src={user?.user_metadata?.avatar_url} className="rounded-full object-cover" />
                        <AvatarFallback className="bg-orange-500 text-white font-bold text-xl">
                            {fallbackChar}
                        </AvatarFallback>
                    </Avatar>
                </Link>
                <div className="flex flex-col">
                    <h1 className="text-[16px] font-extrabold text-slate-800 tracking-tight leading-none mb-1">
                        Hello, {name}
                    </h1>
                    <p className="text-[12px] text-slate-500 font-medium leading-none">
                        {phone} | {network}
                    </p>
                </div>
            </div>

            {/* Right Balance Pill */}
            <Link to={isApproved ? "/wallet" : "#"} className="flex-shrink-0">
                <div className="bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 px-3 py-1.5 rounded-xl flex items-center transition-colors shadow-sm">
                    <span className="text-[14px] font-black text-slate-800">
                        ₹{displayBalance()}
                    </span>
                </div>
            </Link>
        </div>
    );
};
