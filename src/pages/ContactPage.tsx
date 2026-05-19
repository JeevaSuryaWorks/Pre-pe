import { HomeHeader } from "@/components/home/HomeHeader";
import { BottomNav } from "@/components/home/BottomNav";
import { MessageCircle, Mail, ShieldCheck, ChevronRight, Contact, Search, Zap, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ContactPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    
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

    const rechargeContacts = [
        { name: "Jeeva Support", role: "Developer Support", phone: "8668075429", avatarBg: "bg-orange-500" },
        { name: "Amit Sharma", role: "Family", phone: "9876543210", avatarBg: "bg-emerald-500" },
        { name: "Priya Patel", role: "Colleague", phone: "9123456789", avatarBg: "bg-violet-500" },
        { name: "Rahul Verma", role: "Friend", phone: "9988776655", avatarBg: "bg-amber-500" },
        { name: "Sneha Reddy", role: "Sister", phone: "9876123450", avatarBg: "bg-blue-500" },
        { name: "Vikram Singh", role: "Brother", phone: "8123456789", avatarBg: "bg-rose-500" }
    ];

    const filteredContacts = rechargeContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contact.phone.includes(searchQuery) ||
        contact.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                            Manage contacts, make quick payments, and contact support in one place.
                        </p>
                    </div>

                    <Tabs defaultValue="recharge" className="w-full">
                        <TabsList className="grid grid-cols-2 bg-slate-100/80 p-1 rounded-2xl gap-1 mb-5 h-11 w-full shrink-0">
                            <TabsTrigger value="recharge" className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm h-full">
                                Phone Book
                            </TabsTrigger>
                            <TabsTrigger value="support" className="rounded-xl text-[10px] font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm h-full">
                                Help & Support
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="recharge" className="space-y-4 outline-none">
                            {/* Search bar */}
                            <div className="relative w-full">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search contacts by name or number..."
                                    className="pl-10 h-12 bg-white border-slate-100 rounded-2xl font-bold placeholder:text-slate-300 shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Contacts directory */}
                            <div className="space-y-3">
                                {filteredContacts.length === 0 ? (
                                    <div className="py-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm opacity-55">
                                        <Search className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">No Contacts Found</p>
                                    </div>
                                ) : (
                                    filteredContacts.map((contact, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group bg-white p-4.5 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.99]"
                                        >
                                            <div className="flex items-center gap-3.5 text-left min-w-0">
                                                <div className={`h-11 w-11 rounded-2xl ${contact.avatarBg} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                                                    {contact.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-800 leading-none mb-1 truncate">{contact.name}</h4>
                                                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest truncate">{contact.role}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">{contact.phone}</p>
                                                </div>
                                            </div>
                                            
                                            <button
                                                onClick={() => navigate(`/services/mobile?phone=${contact.phone}`)}
                                                className="h-9 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white transition-all duration-300 font-black text-[9px] uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                                            >
                                                <Zap className="w-3.5 h-3.5 fill-current" />
                                                Recharge
                                            </button>
                                        </motion.div>
                                    ))
                                )}
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
