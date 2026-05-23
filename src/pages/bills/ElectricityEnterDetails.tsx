import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Zap, ArrowLeft, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const ElectricityEnterDetails = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const operatorId = searchParams.get('operator') || 'TNEB';

    return (
        <Layout title="Electricity Bill" showBack>
            <div className="bg-slate-50 min-h-screen p-4 flex flex-col justify-center items-center pb-24 relative overflow-hidden">
                {/* Background decorative glows */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-[#FF671F]/5 rounded-full blur-3xl pointer-events-none" />
                
                {/* Bharat Connect Logo */}
                <div className="absolute top-6 right-6 opacity-60 select-none">
                    <img 
                        src="/bharat-connect.svg" 
                        alt="Bharat Connect"
                        className="h-5 w-auto grayscale contrast-125" 
                    />
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="w-full max-w-md bg-white border border-slate-100/90 rounded-[32px] p-8 shadow-xl shadow-slate-900/[0.03] text-center space-y-6 relative overflow-hidden"
                >
                    {/* Glowing zap badge */}
                    <div className="relative mx-auto w-20 h-20 bg-yellow-50 border border-yellow-100 rounded-[24px] flex items-center justify-center shadow-sm select-none">
                        {/* Pulse glow effect */}
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-[24px] bg-yellow-400/20 opacity-75"></span>
                        <Zap className="w-10 h-10 text-yellow-500 relative z-10 fill-yellow-400/10" />
                    </div>

                    <div className="space-y-2">
                        <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 text-[10px] font-black uppercase tracking-widest text-yellow-600 rounded-full select-none">
                            Coming Soon
                        </span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Electricity Service</h3>
                        <p className="text-xs font-black uppercase text-slate-400 tracking-widest bg-slate-50 border border-slate-150 px-3.5 py-1.5 rounded-xl inline-block">
                            Operator: {operatorId.toUpperCase()}
                        </p>
                    </div>

                    <div className="text-sm font-semibold text-slate-500 leading-relaxed max-w-sm mx-auto space-y-4">
                        <p>
                            We are currently upgrading our electricity payment infrastructure to support automated real-time bill fetching.
                        </p>
                        <div className="text-xs text-slate-400 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100/50 flex items-start gap-2.5 text-left">
                            <Shield className="w-4 h-4 text-[#046A38] shrink-0 mt-0.5" />
                            <span>
                                Once active, you'll be able to fetch your bill dynamically through Bharat Connect and pay instantly with cashback rewards.
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

export default ElectricityEnterDetails;
