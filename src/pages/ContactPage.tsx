import { HomeHeader } from "@/components/home/HomeHeader";
import { BottomNav } from "@/components/home/BottomNav";
import { MessageCircle, Mail, ShieldCheck, ChevronRight, Contact, Search, Zap, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ContactPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [typedNumber, setTypedNumber] = useState("");
    
    // Get user details for prefilled message
    const userName = user?.user_metadata?.full_name || 'User';
    const userId = user?.id?.substring(0, 8) || 'N/A';
    const greeting = "Greetings!";

    const getWhatsAppUrl = (phone: string) => {
        const message = `${greeting} I'm ${userName} (ID: ${userId}). I would like to connect with Customer Support regarding Pre-pe.`;
        return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    };

    const supportContacts = [
        {
            name: "Customer Care Support",
            role: "Official WhatsApp Support",
            phone: "8668075429",
            color: "bg-green-600",
            icon: MessageCircle
        }
    ];

    const handleOpenSystemContacts = async () => {
        if ('contacts' in navigator && 'ContactsManager' in window) {
            try {
                const props = ['name', 'tel'];
                const opts = { multiple: false };
                // @ts-ignore
                const contacts = await navigator.contacts.select(props, opts);
                if (contacts && contacts.length > 0) {
                    const contact = contacts[0];
                    const rawPhone = contact.tel?.[0] || '';
                    const cleaned = rawPhone.replace(/\D/g, '').slice(-10); // get last 10 digits
                    if (cleaned.length === 10) {
                        toast.success(`Loaded contact: ${contact.name?.[0] || 'Selected'}`);
                        navigate(`/services/mobile?phone=${cleaned}`);
                    } else {
                        toast.error("Selected contact does not have a valid 10-digit mobile number.");
                    }
                }
            } catch (err: any) {
                console.warn('Native Contact Picker aborted/failed:', err);
                if (err.name !== 'AbortError') {
                    toast.error("Unable to open device contacts. Please ensure permission is granted.");
                }
            }
        } else {
            toast.error("System contact app picker is only available on native mobile devices. Please input manually below.");
        }
    };

    const handleManualProceed = () => {
        const cleaned = typedNumber.replace(/\D/g, '').slice(-10);
        if (cleaned.length === 10) {
            navigate(`/services/mobile?phone=${cleaned}`);
        } else {
            toast.error("Please enter a valid 10-digit mobile number.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex justify-center w-full">
            <div className="w-full max-w-md bg-slate-50 min-h-screen relative pb-28 flex flex-col">
                <div className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-100">
                    <HomeHeader />
                </div>

                <div className="p-5 space-y-6">
                    {/* Hero Section */}
                    <div className="space-y-2 py-2">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                            <Contact className="w-8 h-8 text-blue-600" />
                            Contacts App
                        </h1>
                        <p className="text-slate-500 font-medium text-sm">
                            Open your phone's built-in contact app or dial instantly to initiate mobile recharges.
                        </p>
                    </div>

                    <Tabs defaultValue="recharge" className="w-full">
                        <TabsList className="grid grid-cols-2 bg-slate-100/80 p-1 rounded-2xl gap-1 mb-5 h-11 w-full shrink-0">
                            <TabsTrigger value="recharge" className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm h-full">
                                Native Phone Book
                            </TabsTrigger>
                            <TabsTrigger value="support" className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm h-full">
                                Help & Support
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="recharge" className="space-y-5 outline-none">
                            {/* System contacts launcher button */}
                            <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm text-center space-y-4">
                                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                    <Contact className="w-8 h-8" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-md font-black text-slate-800">Phone's Default Contacts</h3>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                        Tap below to launch your system contact app, select any contact to load their number automatically.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleOpenSystemContacts}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <UserPlus className="w-4 h-4" /> Open Contacts App
                                </Button>
                            </div>

                            {/* Manual entry fallback */}
                            <div className="p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Dial Pad</h4>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            type="tel"
                                            placeholder="Enter 10-digit number..."
                                            className="pl-10 h-12 bg-slate-50 border-slate-100 rounded-xl font-bold placeholder:text-slate-300"
                                            value={typedNumber}
                                            onChange={(e) => setTypedNumber(e.target.value)}
                                        />
                                    </div>
                                    <Button 
                                        onClick={handleManualProceed}
                                        className="h-12 w-12 bg-slate-900 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center shrink-0"
                                    >
                                        <Zap className="w-5 h-5 fill-current text-white" />
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="support" className="space-y-4 outline-none">
                            {/* WhatsApp Support */}
                            <div className="space-y-4">
                                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-1">WhatsApp Support</h2>
                                <div className="grid gap-4">
                                    {supportContacts.map((contact, idx) => (
                                        <motion.a
                                            key={idx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            href={getWhatsAppUrl(contact.phone)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group bg-white p-5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-xl hover:shadow-green-500/10 hover:border-green-100 transition-all active:scale-95"
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center">
                                                    <MessageCircle className="h-6 w-6 text-green-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 group-hover:text-green-600 transition-colors leading-none mb-1">{contact.name}</h4>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{contact.role}</p>
                                                </div>
                                            </div>
                                            <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-all shrink-0">
                                                <ChevronRight className="h-5 w-5" />
                                            </div>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>

                            {/* Email Support */}
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
                            <div className="pt-6 flex flex-col items-center text-center gap-3 opacity-50">
                                <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-200/50 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <ShieldCheck className="w-3 h-3" />
                                    Secure Channel
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold max-w-[200px] pb-6">
                                    Your privacy is our priority. All executive communications are encrypted.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <BottomNav />
            </div>
        </div>
    );
};

export default ContactPage;
