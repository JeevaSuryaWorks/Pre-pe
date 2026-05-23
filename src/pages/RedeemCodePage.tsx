import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";

export const RedeemCodePage = () => {
    const navigate = useNavigate();

    return (
        <Layout title="Google Play Redeem" showBack>
            <div className="bg-slate-50 min-h-screen p-4 flex flex-col justify-center items-center pb-24 relative overflow-hidden">
                {/* Background decorative brand glows */}
                <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/3 right-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-md bg-white border border-slate-100/90 rounded-[32px] p-8 shadow-xl shadow-slate-900/[0.03] text-center space-y-6 relative overflow-hidden"
                >
                    {/* Glowing Google Play arrow logo card */}
                    <div className="relative mx-auto w-20 h-20 bg-white border border-slate-100 rounded-[24px] flex items-center justify-center shadow-md select-none p-4">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" 
                            alt="Google Play"
                            className="w-full h-full object-contain"
                        />
                        {/* Ring pulse */}
                        <span className="animate-ping absolute -inset-1 rounded-[26px] bg-blue-500/5 opacity-75"></span>
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-600 rounded-full select-none">
                            Coming Soon
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-none">Google Play Store</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Recharge & Redeem Codes</p>
                    </div>

                    <div className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto space-y-4">
                        <p>
                            We are integrating Google Play recharge cards to bring you instant, automated code generation and 1-click redemption.
                        </p>
                        <div className="text-xs text-slate-400 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100/50 flex items-start gap-2.5 text-left">
                            <Shield className="w-4 h-4 text-[#046A38] shrink-0 mt-0.5" />
                            <span>
                                Once launched, you can buy Play Store credits directly using your Pre-pe wallet balance and earn instant cashbacks.
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button 
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-slate-900/15 active:scale-98 transition-all flex items-center justify-center gap-2"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-4 h-4" /> Go Back
                        </Button>
                    </div>
                </motion.div>
            </div>
        </Layout>
    );
};

export default RedeemCodePage;
