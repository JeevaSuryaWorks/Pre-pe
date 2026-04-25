import { Button } from "@/components/ui/button";
import { ChevronLeft, Check, Palette, Moon, Sun, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";

const ThemeSettings = () => {
    const navigate = useNavigate();
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

    const themes = [
        { id: 'light', name: 'Light Mode', icon: Sun, color: 'bg-white', text: 'Clean & Bright', border: 'border-amber-100', iconColor: 'text-amber-500' },
        { id: 'dark', name: 'Dark Mode', icon: Moon, color: 'bg-slate-900', text: 'Classic Dark', border: 'border-slate-800', iconColor: 'text-indigo-400' },
        { id: 'system', name: 'System', icon: Monitor, color: 'bg-gradient-to-br from-white via-slate-100 to-slate-900', text: 'Device Default', border: 'border-slate-200', iconColor: 'text-slate-600' },
    ];

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
                    <h1 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Appearance</h1>
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                        <Palette className="w-4 h-4 text-purple-600" />
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="h-px w-12 bg-slate-200 mb-2"></div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Choose Your Vibe</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] max-w-[240px] leading-relaxed">
                            Customize how Pre-pe looks on your device
                        </p>
                    </div>

                    <div className="space-y-4">
                        {themes.map((t) => (
                            <motion.div
                                key={t.id}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setTheme(t.id as any)}
                                className={`
                                    relative p-5 rounded-[2rem] border-2 cursor-pointer transition-all overflow-hidden
                                    ${theme === t.id 
                                        ? 'border-indigo-600 bg-white shadow-2xl shadow-indigo-100' 
                                        : 'border-white bg-white/50 hover:border-slate-200'
                                    }
                                `}
                            >
                                {theme === t.id && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full blur-3xl -mr-8 -mt-8"></div>
                                )}
                                
                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-5">
                                        <div className={`h-16 w-16 rounded-2xl border-4 shadow-inner flex items-center justify-center ${t.color} ${t.border}`}>
                                            <t.icon className={`h-6 w-6 ${t.iconColor}`} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black text-slate-800 tracking-tight">{t.name}</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t.text}</p>
                                        </div>
                                    </div>
                                    
                                    <div className={`
                                        h-8 w-8 rounded-xl flex items-center justify-center transition-all
                                        ${theme === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}
                                    `}>
                                        <Check className={`h-4 w-4 ${theme === t.id ? 'opacity-100' : 'opacity-0'}`} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Preview Area */}
                    <div className="pt-8">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-center space-y-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
                            <p className="text-[10px] font-black text-indigo-300/40 uppercase tracking-[0.3em]">Quick Tip</p>
                            <p className="text-xs font-bold text-slate-300 leading-relaxed relative z-10">
                                Dark mode can help save battery life on devices with OLED screens.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeSettings;

