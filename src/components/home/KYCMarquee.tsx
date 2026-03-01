import { useKYC } from "@/hooks/useKYC";

export const KYCMarquee = () => {
    const { isPending, isApproved } = useKYC();

    if (isApproved) return null;

    return (
        <div className={`py-2 overflow-hidden mx-4 rounded-lg border my-3 ${isPending ? 'bg-amber-50 border-amber-200' : 'bg-blue-100/50 border-blue-200/50'}`}>
            <div className="animate-marquee whitespace-nowrap">
                {isPending ? (
                    <span className="text-xs text-amber-700 font-bold px-4">
                        ⏳ Your KYC verification is currently under review by our administrators. Core features are locked until approved!
                    </span>
                ) : (
                    <>
                        <span className="text-xs text-blue-700 font-medium px-4">
                            📝 Complete your Video KYC to unlock higher transaction limits! It's quick, easy, and completely online.
                        </span>
                        <span className="text-xs text-blue-700 font-medium px-4">
                            ⚡ Instant Wallet Top-up available via UPI. Add money now!
                        </span>
                    </>
                )}
            </div>
        </div>
    );
};
