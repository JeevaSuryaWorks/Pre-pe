import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useState } from "react";
import { useKYC } from "@/hooks/useKYC";
import { KYCNudgeDialog } from "@/components/kyc/KYCNudgeDialog";

export const RedeemCodePage = () => {
    const [phone, setPhone] = useState("");
    const [amount, setAmount] = useState("");
    const { isApproved } = useKYC();
    const [showKYCNudge, setShowKYCNudge] = useState(false);

    const handleSubmit = () => {
        if (!isApproved) {
            setShowKYCNudge(true);
            return;
        }
        // Proceed with logic
    };

    return (
        <Layout title="Google Play Redeem" showBack>
            <div className="bg-blue-50/30 min-h-screen p-4">
                {/* Header Card */}
                <div className="bg-white rounded-xl p-4 flex items-center gap-4 mb-6 shadow-sm border border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden p-2">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" 
                            alt="Google Play"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <span className="font-semibold text-lg text-slate-800">Play Store</span>
                </div>

                {/* Form */}
                <div className="space-y-5">

                    {/* Phone Number Input */}
                    <div className="relative">
                        <Label htmlFor="phone" className="absolute -top-2.5 left-4 bg-white px-1 text-xs text-slate-500 z-10 font-medium">Phone Number</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="h-14 border-blue-900/80 border-2 rounded-xl text-lg pl-4 focus-visible:ring-0 focus-visible:border-blue-700 bg-transparent"
                        />
                    </div>

                    {/* Amount Input */}
                    <div className="relative">
                        <Label htmlFor="amount" className="absolute top-4 left-4 text-slate-500 text-base" style={{ display: amount ? 'none' : 'block' }}>Amount</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-14 border-gray-200 border rounded-xl text-lg pl-4 bg-gray-50 focus:bg-white transition-colors"
                        />
                    </div>

                    <Button
                        className="w-full h-12 bg-slate-400 hover:bg-slate-500 text-white font-medium rounded-xl text-base shadow-none"
                        onClick={handleSubmit}
                    >
                        Submit
                    </Button>
                </div>

                <KYCNudgeDialog
                    isOpen={showKYCNudge}
                    onClose={() => setShowKYCNudge(false)}
                    featureName="Google Play Redemption"
                />
            </div>
        </Layout>
    );
};
