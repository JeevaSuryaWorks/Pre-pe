import { HomeHeader } from "@/components/home/HomeHeader";
import { PromoBanner } from "@/components/home/PromoBanner";
import { KYCMarquee } from "@/components/home/KYCMarquee";
import { ServiceGrid } from "@/components/home/ServiceGrid";
import { HomeFooter } from "@/components/home/HomeFooter";
import { BottomNav } from "@/components/home/BottomNav";

const HomePage = () => {
    return (
        <div className="min-h-screen bg-slate-50 flex justify-center w-full">
            <div className="w-full max-w-md bg-white shadow-2xl min-h-screen relative pb-28 flex flex-col">
                <HomeHeader />

                {/* Tagline Section */}
                <div className="px-4 py-2 mt-2">
                    <div className="bg-blue-50/50 rounded-2xl border border-blue-100/30 py-2">
                        <p className="text-[11px] font-bold text-blue-800 text-center uppercase tracking-widest opacity-80 leading-relaxed italic">
                            Prepe - Your Trusted Payment Partner
                        </p>
                    </div>
                </div>

                <div className="flex-1">
                    <PromoBanner />
                    <div className="mt-4">
                        <KYCMarquee />
                    </div>
                    <div className="mt-6">
                        <ServiceGrid />
                    </div>
                    <HomeFooter />
                </div>

                <BottomNav />
            </div>
        </div>
    );
};

export default HomePage;
