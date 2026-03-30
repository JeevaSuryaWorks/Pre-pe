import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquareText, Smartphone, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";

export const HomeHeader = () => {
    const { user } = useAuth();

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white sticky top-0 z-10 border-b border-gray-100/50">
            {/* Left Placeholder for centering */}
            <div className="w-10"></div>

            {/* Center Logo */}
            <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600">
                    <Smartphone className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                    Prepe
                </h1>
            </div>

            {/* Right Menu / Profile Link */}
            <Link to="/profile">
                <div className="h-10 w-10 flex items-center justify-center bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                    <Avatar className="h-10 w-10 bg-transparent">
                        <AvatarImage src={user?.user_metadata?.avatar_url} className="rounded-full object-cover" />
                        <AvatarFallback className="bg-transparent text-green-700">
                            <User className="h-6 w-6" />
                        </AvatarFallback>
                    </Avatar>
                </div>
            </Link>
        </div>
    );
};
