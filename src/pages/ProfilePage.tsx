import React, { memo } from "react";
import { BottomNav } from "@/components/home/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
    User, Mail, Shield, ChevronRight, Palette, Lock,
    FileText, Headphones, Share2, Tag, FileCheck,
    History, LogOut, Facebook, Youtube, Send, Instagram,
    Twitter, ChevronLeft, Loader2, ShieldCheck
} from "lucide-react";
import { useKYC } from "@/hooks/useKYC";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

// Memoized SettingItem to prevent unnecessary re-renders of the list
const SettingItem = memo(({ icon: Icon, title, subtitle, onClick, colorClass = "text-slate-600", bgClass = "bg-slate-100" }: any) => (
    <div
        onClick={onClick}
        className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border-b border-slate-50 last:border-0 cursor-pointer transition-colors"
    >
        <div className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-full ${bgClass} flex items-center justify-center`}>
                <Icon className={`h-5 w-5 ${colorClass}`} />
            </div>
            <div>
                <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
                {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
        </div>
        <ChevronRight className="h-5 w-5 text-slate-300" />
    </div>
));

SettingItem.displayName = 'SettingItem';

const SectionHeader = memo(({ title }: { title: string }) => (
    <h3 className="px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider mt-2">
        {title}
    </h3>
));

SectionHeader.displayName = 'SectionHeader';

const SocialMediaFooter = memo(() => (
    <div className="py-8 text-center space-y-4">
        <p className="text-sm font-medium text-slate-500">Follow Us On Social Media</p>
        <div className="flex justify-center gap-4">
            {[
                { icon: Instagram, color: "bg-pink-600" },
                { icon: Youtube, color: "bg-red-600" },
                { icon: Twitter, color: "bg-black" }, // X icon
                { icon: Facebook, color: "bg-blue-600" },
                { icon: Send, color: "bg-blue-400" } // Telegram
            ].map((social, i) => (
                <div key={i} className={`${social.color} text-white h-10 w-10 rounded-full flex items-center justify-center shadow-md cursor-pointer hover:opacity-90`}>
                    <social.icon className="h-5 w-5" />
                </div>
            ))}
        </div>
        <p className="text-xs text-slate-400">Version 2.0.1</p>
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
        <div className="min-h-screen bg-slate-50 flex justify-center w-full">
            <div className="w-full max-w-md bg-slate-50 min-h-screen relative pb-28 flex flex-col">

                {/* Header */}
                <div className="bg-white px-4 py-4 flex items-center gap-4 shadow-sm sticky top-0 z-10">
                    <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 h-10 w-10 text-slate-600" onClick={() => navigate(-1)}>
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <h1 className="text-xl font-bold text-slate-800">Settings</h1>
                </div>

                {/* Content Scroll Area */}
                <div className="p-4 space-y-2 overflow-y-auto">

                    {/* Profile Card */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 mb-4">
                        <Avatar className="h-16 w-16 bg-blue-50">
                            <AvatarImage src={user?.user_metadata?.avatar_url} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-bold text-xl">{getInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col flex-1">
                            <h2 className="text-lg font-bold text-slate-800">{user?.user_metadata?.full_name || 'User Name'}</h2>
                            <p className="text-sm text-slate-500 font-medium">{user?.phone || user?.user_metadata?.phone || ''}</p>
                            <p className="text-xs text-slate-400">{user?.email}</p>
                        </div>
                        <div className="flex flex-col items-center">
                            {kycLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                            ) : kycStatus === 'APPROVED' ? (
                                <div className="p-2 bg-green-50 text-green-600 rounded-full border border-green-100 flex items-center gap-1">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                            ) : kycStatus === 'PENDING' ? (
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                                    <History className="w-5 h-5" />
                                </div>
                            ) : (
                                <div className="p-2 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                                    <Shield className="w-5 h-5" />
                                </div>
                            )}
                            <span className="text-[10px] font-bold mt-1 text-slate-500">
                                {isAdmin ? 'ADMIN' : (kycStatus === 'APPROVED' ? 'VERIFIED' : kycStatus === 'PENDING' ? 'PENDING' : 'UPGRADE')}
                            </span>
                        </div>
                    </div>

                    {/* Admin Dashboard Entry - Secret for Admins only */}
                    {isAdmin && (
                        <div className="bg-slate-900 rounded-2xl p-4 shadow-lg flex items-center justify-between group cursor-pointer hover:bg-slate-800 transition-all border border-slate-700" onClick={() => navigate('/admin')}>
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                    <ShieldCheck className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-white">Admin Dashboard</h4>
                                    <p className="text-xs text-slate-400">Access Management & Controls</p>
                                </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                                <ChevronRight className="h-5 w-5 text-white" />
                            </div>
                        </div>
                    )}

                    {/* General Settings Group */}
                    <SectionHeader title="General Settings" />
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <SettingItem icon={User} title="Profile Settings" subtitle="Name, Email Id" colorClass="text-blue-600" bgClass="bg-blue-50" onClick={() => navigate('/profile/edit')} />
                        <SettingItem icon={Palette} title="Theme Settings" subtitle="Dark, Light, System" colorClass="text-purple-600" bgClass="bg-purple-50" onClick={() => navigate('/profile/theme')} />
                        <SettingItem icon={Lock} title="Security Settings" subtitle="App lock, M-Pin" colorClass="text-orange-600" bgClass="bg-orange-50" onClick={() => navigate('/profile/security')} />
                        <SettingItem icon={FileCheck} title="KYC / Upgrade Account" subtitle="Identity Verification" colorClass="text-green-600" bgClass="bg-green-50" onClick={() => navigate('/profile/kyc')} />
                        <SettingItem icon={History} title="Transactions History" subtitle="Recharge, Bill, etc." colorClass="text-cyan-600" bgClass="bg-cyan-50" onClick={() => navigate('/transactions')} />
                        <SettingItem icon={Headphones} title="24x7 Help & Support" subtitle="Support, FAQ" colorClass="text-pink-600" bgClass="bg-pink-50" onClick={() => navigate('/contact')} />
                        <SettingItem icon={Share2} title="Refer & Earn" subtitle="Cashback every time" colorClass="text-indigo-600" bgClass="bg-indigo-50" onClick={() => navigate('/profile/refer')} />
                        <SettingItem icon={Tag} title="Cashback & Offers" subtitle="Reward Points, Vouchers" colorClass="text-yellow-600" bgClass="bg-yellow-50" onClick={() => navigate('/profile/offers')} />
                    </div>

                    {/* Review & Policy Group */}
                    <SectionHeader title="Review & Policy" />
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <SettingItem icon={FileText} title="Terms & Conditions" onClick={() => navigate('/legal/terms')} />
                        <SettingItem icon={Shield} title="Privacy Policy" onClick={() => navigate('/legal/privacy')} />
                        <SettingItem icon={FileText} title="Refund Policy" onClick={() => navigate('/legal/refund')} />
                        <SettingItem icon={FileCheck} title="Rate & Review" onClick={() => window.open('market://details?id=com.prepe.app', '_blank')} />
                    </div>

                    {/* Logout */}
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mt-6" onClick={handleLogout}>
                        <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-red-50 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                                <LogOut className="h-5 w-5 text-slate-600" />
                            </div>
                            <h4 className="text-sm font-semibold text-slate-800">Logout</h4>
                        </div>
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
