import { Button } from "@/components/ui/button";
import { ChevronLeft, Lock, Fingerprint, ShieldAlert, ShieldCheck, KeyRound, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

const SecuritySettings = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center w-full">
            <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen relative flex flex-col pb-10">
                
                {/* Premium Header */}
                <div className="bg-white/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-100/50 shadow-sm">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 hover:bg-slate-100" 
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Security</h1>
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
                        <Lock className="w-4 h-4 text-rose-600" />
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {/* Security Overview Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
                        <div className="relative z-10 flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-xl">
                                <ShieldCheck className="w-8 h-8 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-lg font-black text-white uppercase tracking-tight">Account Shield</h2>
                                <p className="text-xs font-bold text-indigo-300/60 uppercase tracking-widest leading-relaxed">
                                    Your account is protected by 256-bit <br />bank-grade encryption
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <div className="space-y-6">
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-px w-12 bg-slate-200 mb-2"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Privacy Controls</p>
                        </div>

                        {/* Security Controls */}
                        <div className="bg-white rounded-[2.5rem] p-4 shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-white space-y-2">
                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                                        <Smartphone className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">App Lock</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Device Passcode</p>
                                    </div>
                                </div>
                                <Switch className="data-[state=checked]:bg-indigo-600" />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                        <Fingerprint className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-slate-800 tracking-tight">Biometrics</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Touch / Face ID</p>
                                    </div>
                                </div>
                                <Switch defaultChecked className="data-[state=checked]:bg-indigo-600" />
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="h-px w-12 bg-slate-200 mb-2"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Secret Credentials</p>
                        </div>

                        {/* M-PIN Section */}
                        <div className="bg-amber-50/50 p-6 rounded-[2.5rem] border border-amber-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-[60px] opacity-20 -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                            <div className="flex items-start gap-4 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center border border-amber-200 shadow-sm shrink-0">
                                    <KeyRound className="h-5 w-5 text-amber-600" />
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <h3 className="text-sm font-black text-amber-900 uppercase tracking-tight">Access M-PIN</h3>
                                        <p className="text-[10px] font-bold text-amber-700/60 uppercase tracking-widest mt-1 leading-relaxed">
                                            Regularly changing your PIN keeps your <br />wallet transactions secure.
                                        </p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        className="h-10 px-6 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-amber-200 transition-all active:scale-95"
                                    >
                                        Update PIN
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SecuritySettings;

