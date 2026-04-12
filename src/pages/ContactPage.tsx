import { HomeHeader } from "@/components/home/HomeHeader";
import { BottomNav } from "@/components/home/BottomNav";
import { MessageCircle, Mail, UserCheck, ShieldCheck, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const ContactPage = () => {
    const { user } = useAuth();
    
    // Get user details for prefilled message
    const userName = user?.user_metadata?.full_name || 'User';
    const userId = user?.id?.substring(0, 8) || 'N/A';
    const greeting = "Greetings!";

    const getWhatsAppUrl = (phone: string, executiveName: string) => {
        const message = `${greeting} I'm ${userName} (ID: ${userId}). I would like to connect with you regarding Pre-pe.`;
        return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    };

    const contacts = [
        {
            name: "Boopathiraja",
            role: "Founder of Prepe",
            phone: "8668075429",
            color: "bg-green-600",
            icon: UserCheck
        },
        {
            name: "Surya",
            role: "CTO",
            phone: "9789456787",
            color: "bg-indigo-600",
            icon: ShieldCheck
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center w-full">
            <div className="w-full max-w-md bg-slate-50 min-h-screen relative pb-28 flex flex-col">
                <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
                    <HomeHeader />
                </div>

                <div className="p-5 space-y-6">
                    {/* Hero Section */}
                    <div className="space-y-2 py-4">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Contact Support</h1>
                        <p className="text-slate-500 font-medium">Have questions? Our leadership and support team are here to help you grow your business.</p>
                    </div>

                    {/* Executive Section */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Core Leadership</h2>
                        <div className="grid gap-4">
                            {contacts.map((contact, idx) => (
                                <motion.a
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    href={getWhatsAppUrl(contact.phone, contact.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all active:scale-95"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className={`h-12 w-12 rounded-2xl ${contact.color}/10 flex items-center justify-center`}>
                                            <contact.icon className={`h-6 w-6 ${contact.color.replace('bg-', 'text-')}`} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-none mb-1">{contact.name}</h4>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{contact.role}</p>
                                        </div>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all shrink-0">
                                        <MessageCircle className="h-5 w-5" />
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Support Section */}
                    <div className="space-y-4">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">Support Channels</h2>
                        <a 
                            href="mailto:connect.prepe@gmail.com"
                            className="block bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 hover:border-slate-200 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                    <Mail className="h-6 w-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800">Email Support</h4>
                                    <p className="text-xs text-slate-500 font-medium">connect.prepe@gmail.com</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
                            </div>
                        </a>
                    </div>

                    {/* Security Badge */}
                    <div className="pt-10 flex flex-col items-center text-center gap-3 opacity-50 pb-10">
                        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-200/50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <ShieldCheck className="w-3 h-3" />
                            Secure Channel
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold max-w-[200px]">
                            Your privacy is our priority. All executive communications are encrypted.
                        </p>
                    </div>
                </div>

                <BottomNav />
            </div>
        </div>
    );
};

export default ContactPage;
