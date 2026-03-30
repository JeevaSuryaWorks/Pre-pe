import { HomeHeader } from "@/components/home/HomeHeader";
import { WhatsAppBanner } from "@/components/home/WhatsAppBanner";
import { WalletCard } from "@/components/home/WalletCard";
import { KYCMarquee } from "@/components/home/KYCMarquee";
import { ServiceGrid } from "@/components/home/ServiceGrid";
import { HomeFooter } from "@/components/home/HomeFooter";
import { BottomNav } from "@/components/home/BottomNav";

const HomePage = () => {
    return (
        <div className="min-h-screen bg-blue-50/30 flex justify-center w-full">
            <div className="w-full max-w-md bg-white shadow-xl min-h-screen relative pb-24 flex flex-col">
                <HomeHeader />

                <div className="px-4 py-3 bg-green-50/50 border-b border-green-100/30">
                    <p className="text-xs font-medium text-green-800 text-center leading-relaxed italic">
                        "Prepe - We Take care of your Payments & Bill Dues at Just a Click"
                    </p>
                </div>

                <div className="bg-gradient-to-b from-white to-blue-50/30 flex-1">
                    <WhatsAppBanner />
                    <WalletCard />
                    <KYCMarquee />
                    <ServiceGrid />
                    <HomeFooter />
                </div>

                <BottomNav />
            </div>
        </div>
    );
};

export default HomePage;
