import { motion } from "framer-motion";
import { 
    ShieldCheck, Lock, Fingerprint, Eye, 
    ShieldAlert, BadgeCheck, Zap, Globe,
    ChevronLeft, ArrowRight, Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SafetyPage = () => {
    const navigate = useNavigate();

    const sections = [
        {
            icon: Lock,
            title: "End-to-End Encryption",
            desc: "Every transaction and piece of personal data is encrypted using military-grade AES-256 protocols.",
            color: "emerald"
        },
        {
            icon: Fingerprint,
            title: "Biometric Security",
            desc: "Secure your wallet with FaceID or Fingerprint authentication for a seamless yet impenetrable experience.",
            color: "blue"
        },
        {
            icon: Eye,
            title: "Zero-Knowledge Privacy",
            desc: "We never see your passwords or private keys. Your data belongs solely to you, stored locally and securely.",
            color: "purple"
        },
        {
            icon: BadgeCheck,
            title: "Fraud Protection",
            desc: "Real-time AI monitoring detects and blocks suspicious activities before they can affect your account.",
            color: "amber"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white flex justify-center w-full overflow-x-hidden">
            <div className="w-full max-w-md bg-slate-900 shadow-2xl min-h-screen relative pb-20 flex flex-col">
                
                {/* Background Decorations */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />
                <div className="absolute top-40 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-40 -right-20 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Header */}
                <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-black uppercase tracking-[0.2em] text-emerald-400">Security Hub</h1>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <div className="p-6 pt-10 space-y-10">
                    {/* Hero Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center space-y-4"
                    >
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
                            <ShieldCheck className="w-20 h-20 text-emerald-400 mx-auto relative z-10" strokeWidth={1} />
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter">Your safety is our executive priority.</h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                            We employ state-of-the-art security measures to ensure your financial assets remain untouched and private.
                        </p>
                    </motion.div>

                    {/* Safety Cards */}
                    <div className="grid grid-cols-1 gap-4">
                        {sections.map((s, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative p-6 rounded-[32px] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all overflow-hidden"
                            >
                                <div className={cn(
                                    "absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
                                    s.color === 'emerald' ? "bg-emerald-500" :
                                    s.color === 'blue' ? "bg-blue-500" :
                                    s.color === 'purple' ? "bg-purple-500" : "bg-amber-500"
                                )} />
                                
                                <div className="relative z-10 flex gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                        s.color === 'emerald' ? "bg-emerald-500/20 text-emerald-400" :
                                        s.color === 'blue' ? "bg-blue-500/20 text-blue-400" :
                                        s.color === 'purple' ? "bg-purple-500/20 text-purple-400" : "bg-amber-500/20 text-amber-400"
                                    )}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="font-black text-white tracking-tight">{s.title}</h4>
                                        <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                                            {s.desc}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Compliance Section */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-8 text-center"
                    >
                        <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-4" />
                        <h4 className="text-lg font-black text-white mb-2">Global Standards</h4>
                        <p className="text-[11px] text-emerald-100/50 font-medium mb-6 leading-relaxed">
                            Prepe is compliant with PCI-DSS Level 1 and GDPR data protection regulations, ensuring the highest level of bank-grade security.
                        </p>
                        <div className="flex justify-center gap-6">
                            <div className="flex flex-col items-center gap-1 opacity-50 grayscale hover:grayscale-0 transition-all">
                                <Zap className="w-5 h-5 text-white" />
                                <span className="text-[8px] font-black uppercase tracking-widest">PCI-DSS</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 opacity-50 grayscale hover:grayscale-0 transition-all">
                                <Globe className="w-5 h-5 text-white" />
                                <span className="text-[8px] font-black uppercase tracking-widest">ISO 27001</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 opacity-50 grayscale hover:grayscale-0 transition-all">
                                <ShieldAlert className="w-5 h-5 text-white" />
                                <span className="text-[8px] font-black uppercase tracking-widest">SECURE</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Footer CTA */}
                    <div className="pt-4 text-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">
                            Trusted by 1M+ Executives
                        </p>
                        <Button 
                            onClick={() => navigate('/')}
                            className="bg-white text-slate-900 hover:bg-emerald-50 font-black rounded-2xl w-full h-14 shadow-xl transition-all active:scale-95 text-sm uppercase tracking-widest"
                        >
                            Return to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Bottom Watermark */}
                <div className="mt-10 py-10 flex flex-col items-center opacity-10">
                    <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white text-center">
                        PREPE ENCRYPTION KEY: POS-99-EXECUTIVE
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SafetyPage;
