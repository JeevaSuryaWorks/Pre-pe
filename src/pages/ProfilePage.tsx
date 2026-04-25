import React, { memo } from "react";
import { BottomNav } from "@/components/home/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    User, Mail, Shield, ChevronRight, Palette, Lock,
    FileText, Headphones, Share2, Tag, FileCheck,
    History, LogOut, Facebook, Youtube, Send, Instagram,
    Twitter, ChevronLeft, Loader2, ShieldCheck, Sparkles,
    Settings, Bell, CreditCard, Wallet, Crown, ArrowRight
} from "lucide-react";
import { useKYC } from "@/hooks/useKYC";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Memoized SettingItem with a more premium look
const SettingItem = memo(({ icon: Icon, title, subtitle, onClick, colorClass = "text-slate-600", bgClass = "bg-slate-100" }: any) => (
    <motion.div
        whileHover={{ x: 4, backgroundColor: "rgba(248, 250, 252, 0.8)" }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex items-center justify-between p-4 bg-white/50 backdrop-blur-sm border-b border-slate-50 last:border-0 cursor-pointer transition-all rounded-xl mb-1"
    >
        <div className="flex items-center gap-4">
            <div className={`h-11 w-11 rounded-2xl ${bgClass} flex items-center justify-center shadow-sm`}>
                <Icon className={`h-5 w-5 ${colorClass}`} />
            </div>
            <div>
                <h4 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h4>
                {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
            </div>
        </div>
        <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-slate-300" />
        </div>
    </motion.div>
));

SettingItem.displayName = 'SettingItem';

const SectionHeader = memo(({ title }: { title: string }) => (
    <div className="flex items-center gap-3 px-2 py-4 mt-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            {title}
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
    </div>
));

SectionHeader.displayName = 'SectionHeader';

const SocialMediaFooter = memo(() => (
    <div className="py-12 text-center space-y-6">
        <div className="flex flex-col items-center gap-2">
            <div className="h-px w-12 bg-slate-200 mb-2"></div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Connect With Us</p>
        </div>
        <div className="flex justify-center gap-4">
            {[
                { icon: Instagram, color: "bg-slate-900", hover: "hover:bg-pink-600" },
                { icon: Youtube, color: "bg-slate-900", hover: "hover:bg-red-600" },
                { icon: Twitter, color: "bg-slate-900", hover: "hover:bg-blue-400" },
                { icon: Facebook, color: "bg-slate-900", hover: "hover:bg-blue-600" },
                { icon: Send, color: "bg-slate-900", hover: "hover:bg-sky-500" }
            ].map((social, i) => (
                <motion.div 
                    key={i} 
                    whileHover={{ y: -4, scale: 1.1 }}
                    className={`${social.color} ${social.hover} text-white h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg cursor-pointer transition-all`}
                >
                    <social.icon className="h-4 w-4" />
                </motion.div>
            ))}
        </div>
        <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-300 tracking-[0.3em] uppercase">Pre-pe India</p>
            <p className="text-[9px] font-bold text-slate-400">v2.1.0 • Stable Build</p>
        </div>
    </div>
));

SocialMediaFooter.displayName = 'SocialMediaFooter';

const ProfilePage = () => {
    const { user, signOut } = useAuth();
    const { status: kycStatus, isInitialLoading: kycLoading } = useKYC();
    const navigate = useNavigate();

    const AUTHORIZED_ADMINS = [
        'connect.prepe@gmail.com',
        'prepeindia@outlook.com',
        'prepeindia@zohomail.in',
        'jeevasuriya2007@gmail.com'
    ];

    const isAdmin = AUTHORIZED_ADMINS.includes(user?.email || '');

    const getInitials = () => {
        const name = user?.user_metadata?.full_name || 'Admin';
        return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center w-full">
            <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen relative pb-28 flex flex-col">

                {/* Hero Header Section */}
                <div className="relative h-56 bg-slate-950 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/30 via-transparent to-emerald-600/20"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]"></div>
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]"></div>
                    
                    <div className="relative z-10 px-6 pt-8 flex items-center justify-between">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-2xl bg-white/5 border border-white/10 text-white backdrop-blur-xl hover:bg-white/10" 
                            onClick={() => navigate(-1)}
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h1 className="text-sm font-black text-white uppercase tracking-[0.3em]">Settings</h1>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-2xl bg-white/5 border border-white/10 text-white backdrop-blur-xl hover:bg-white/10"
                        >
                            <Bell className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F8FAFC] to-transparent"></div>
                </div>

                {/* Profile Card Overlay */}
                <div className="px-6 -mt-24 relative z-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white relative overflow-hidden"
                    >
                        <div className="flex items-center gap-5 relative z-10">
                            <div className="relative">
                                <Avatar className="h-20 w-20 ring-4 ring-slate-50 shadow-2xl rounded-[1.5rem] overflow-hidden">
                                    <AvatarImage src={user?.user_metadata?.avatar_url} className="object-cover w-full h-full" />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-black text-2xl">
                                        {getInitials()}
                                    </AvatarFallback>
                                </Avatar>
                                {kycStatus === 'APPROVED' && (
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full ring-4 ring-white shadow-lg">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight truncate">
                                        {user?.user_metadata?.full_name || 'User Name'}
                                    </h2>
                                    {isAdmin && (
                                        <div className="px-2 py-0.5 bg-indigo-600 text-[8px] font-black text-white rounded-md tracking-widest">
                                            PRO
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">{user?.email}</p>
                                
                                <div className="flex items-center gap-3 mt-3">
                                    <div className="px-3 py-1 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-1.5">
                                        <Crown className="w-3 h-3 text-amber-500" />
                                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                            {isAdmin ? 'Elite Admin' : 'Basic Member'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mt-8 pt-6 border-t border-slate-50">
                            <div className="text-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <div className="flex items-center justify-center gap-1.5">
                                    {kycLoading ? (
                                        <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                                    ) : (
                                        <span className={`text-xs font-black ${kycStatus === 'APPROVED' ? 'text-emerald-600' : 'text-amber-500'}`}>
                                            {kycStatus === 'APPROVED' ? 'VERIFIED' : 'UPGRADE'}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center p-3 rounded-2xl bg-slate-50/50 border border-slate-100">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                                <p className="text-xs font-black text-slate-800">
                                    {new Date(user?.created_at || Date.now()).getFullYear()}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Settings Content Area */}
                <div className="px-6 py-8 space-y-2">

                    {/* Admin Section */}
                    {isAdmin && (
                        <motion.div 
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/admin')}
                            className="bg-slate-900 rounded-3xl p-5 shadow-2xl flex items-center justify-between group cursor-pointer border border-white/10 relative overflow-hidden mb-6"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent"></div>
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 backdrop-blur-xl">
                                    <ShieldCheck className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Admin Console</h4>
                                    <p className="text-[10px] font-bold text-indigo-300/60 uppercase tracking-widest">Full Control Center</p>
                                </div>
                            </div>
                            <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all border border-white/10">
                                <ArrowRight className="h-5 w-5 text-white" />
                            </div>
                        </motion.div>
                    )}

                    {/* General Settings */}
                    <SectionHeader title="Account Management" />
                    <div className="space-y-1">
                        <SettingItem 
                            icon={User} 
                            title="Personal Info" 
                            subtitle="Edit your profile" 
                            colorClass="text-indigo-600" 
                            bgClass="bg-indigo-50" 
                            onClick={() => navigate('/profile/edit')} 
                        />
                        <SettingItem 
                            icon={History} 
                            title="My Ledger" 
                            subtitle="View transactions" 
                            colorClass="text-emerald-600" 
                            bgClass="bg-emerald-50" 
                            onClick={() => navigate('/transactions')} 
                        />
                        <SettingItem 
                            icon={Share2} 
                            title="Referral Program" 
                            subtitle="Earn rewards" 
                            colorClass="text-amber-600" 
                            bgClass="bg-amber-50" 
                            onClick={() => navigate('/profile/refer')} 
                        />
                        <SettingItem 
                            icon={Lock} 
                            title="Security & PIN" 
                            subtitle="Protect account" 
                            colorClass="text-rose-600" 
                            bgClass="bg-rose-50" 
                            onClick={() => navigate('/profile/security')} 
                        />
                    </div>

                    {/* App Settings */}
                    <SectionHeader title="Application" />
                    <div className="space-y-1">
                        <SettingItem 
                            icon={Palette} 
                            title="Appearance" 
                            subtitle="Themes & UI" 
                            colorClass="text-purple-600" 
                            bgClass="bg-purple-50" 
                            onClick={() => navigate('/profile/theme')} 
                        />
                        <SettingItem 
                            icon={Headphones} 
                            title="Help Center" 
                            subtitle="24x7 Support" 
                            colorClass="text-sky-600" 
                            bgClass="bg-sky-50" 
                            onClick={() => navigate('/contact')} 
                        />
                        <SettingItem 
                            icon={Tag} 
                            title="Active Offers" 
                            subtitle="Coupons & Promo" 
                            colorClass="text-pink-600" 
                            bgClass="bg-pink-50" 
                            onClick={() => navigate('/rewards')} 
                        />
                    </div>

                    {/* Legal & Policies */}
                    <SectionHeader title="Legal" />
                    <div className="space-y-1">
                        <SettingItem icon={FileText} title="Terms & Conditions" onClick={() => navigate('/legal/terms')} />
                        <SettingItem icon={Shield} title="Privacy Policy" onClick={() => navigate('/legal/privacy')} />
                        <SettingItem icon={FileCheck} title="App Feedback" onClick={() => window.open('market://details?id=com.prepe.app', '_blank')} />
                    </div>

                    {/* Logout Button */}
                    <div className="pt-6 px-2">
                        <Button 
                            variant="ghost" 
                            onClick={handleLogout}
                            className="w-full h-14 rounded-2xl bg-white border border-slate-100 shadow-sm text-rose-600 font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100 transition-all flex items-center justify-between px-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-rose-50 flex items-center justify-center">
                                    <LogOut className="h-4 w-4" />
                                </div>
                                <span>Sign Out</span>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-30" />
                        </Button>
                    </div>

                    {/* Social Media Footer */}
                    <SocialMediaFooter />

                </div>

                <BottomNav />
            </div>
        </div>
    );
};

export default memo(ProfilePage);

