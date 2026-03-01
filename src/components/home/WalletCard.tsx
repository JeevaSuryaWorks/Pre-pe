import { Plus, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useKYC } from "@/hooks/useKYC";

export const WalletCard = () => {
    const { availableBalance, loading, refetch } = useWallet();
    const { isApproved, isLoading: kycLoading } = useKYC();

    const displayBalance = () => {
        if (loading || kycLoading) return "...";
        if (!isApproved) return "****.**";
        return availableBalance.toFixed(2);
    };

    return (
        <div className="px-4 py-2">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-1.5 mb-1">
                        <p className="text-xs text-gray-500 font-medium">Your Balance</p>
                        {!isApproved && !kycLoading && (
                            <div className="flex items-center gap-1 text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full border border-amber-100">
                                <ShieldAlert className="w-2.5 h-2.5" />
                                <span>KYC Required</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold text-gray-900">
                            ₹{displayBalance()}
                        </h2>
                        <button
                            onClick={() => refetch()}
                            disabled={loading}
                            className="text-gray-400 hover:text-primary transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                <Link to={isApproved ? "/fund-request" : "#"} onClick={(e) => {
                    if (!isApproved) {
                        e.preventDefault();
                    }
                }}>
                    <Button
                        variant="outline"
                        className={`border-none rounded-lg px-4 gap-2 font-semibold h-10 ${!isApproved ? 'bg-slate-100 text-slate-400 opacity-60 cursor-not-allowed hover:bg-slate-100' : 'bg-blue-50 hover:bg-blue-100 text-blue-700'}`}
                        disabled={!isApproved}
                    >
                        <Plus className="w-4 h-4" />
                        ADD MONEY
                    </Button>
                </Link>
            </div>
        </div>
    );
};
