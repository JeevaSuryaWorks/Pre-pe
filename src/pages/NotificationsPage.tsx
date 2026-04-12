import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
    Bell, ChevronLeft, Megaphone, ShieldAlert, 
    Calendar, Inbox, Loader2, Info, ArrowRight,
    CircleCheck, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NotificationItem {
    id: string;
    type: 'announcement' | 'rejection';
    title: string;
    content: string;
    date: string;
    cta_link?: string;
    cta_text?: string;
    icon?: any;
    color?: string;
}

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const allNotifications: NotificationItem[] = [];

            // 1. Fetch Global Announcements (banners)
            try {
                const { data: announcements, error: annError } = await supabase
                    .from('banners' as any)
                    .select('*')
                    .eq('type', 'announcement')
                    .eq('status', 'published')
                    .order('sort_order', { ascending: true });

                if (annError) {
                    // Check for common column mismatch errors (400)
                    if (annError.code === '42703' || annError.message?.includes('column')) {
                        console.warn("Banners table is missing columns. Attempting generic fetch.");
                        const { data: fallbackAnns } = await supabase
                            .from('banners' as any)
                            .select('*')
                            .limit(5);
                        
                        if (fallbackAnns) {
                            fallbackAnns.forEach((a: any) => {
                                allNotifications.push({
                                    id: a.id,
                                    type: 'announcement',
                                    title: a.title || 'Notification',
                                    content: a.subtitle || a.content || 'Check out this update!',
                                    date: a.updated_at || a.created_at || new Date().toISOString(),
                                    cta_link: a.cta_link,
                                    cta_text: a.cta_text,
                                    icon: Megaphone,
                                    color: 'blue'
                                });
                            });
                        }
                    } else {
                        throw annError;
                    }
                } else if (announcements) {
                    announcements.forEach((a: any) => {
                        allNotifications.push({
                            id: a.id,
                            type: 'announcement',
                            title: a.title,
                            content: a.subtitle || 'Check out this new update!',
                            date: a.updated_at || a.created_at,
                            cta_link: a.cta_link,
                            cta_text: a.cta_text,
                            icon: Megaphone,
                            color: 'blue'
                        });
                    });
                }
            } catch (err) {
                console.error("Announcements fetch failed:", err);
            }

            // 2. Fetch User KYC Rejections
            try {
                const { data: kycRejections, error: kycError } = await supabase
                    .from('kyc_verifications' as any)
                    .select('*')
                    .eq('user_id', user?.id)
                    .eq('status', 'REJECTED')
                    .order('updated_at', { ascending: false });

                if (!kycError && kycRejections) {
                    kycRejections.forEach((k: any) => {
                        allNotifications.push({
                            id: `kyc-${k.id}`,
                            type: 'rejection',
                            title: 'KYC Verification Rejected',
                            content: k.rejection_reason || 'Your KYC application was rejected by the administrator. Please re-submit with clear documents.',
                            date: k.updated_at,
                            cta_link: '/kyc',
                            cta_text: 'Fix Now',
                            icon: ShieldAlert,
                            color: 'rose'
                        });
                    });
                }
            } catch (err) {
                console.error("KYC rejections fetch failed:", err);
            }

            // Sort by date descending
            allNotifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setNotifications(allNotifications);
        } catch (err) {
            console.error("Global notification fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex justify-center w-full overflow-x-hidden">
            <div className="w-full max-w-md bg-white shadow-2xl min-h-screen relative pb-20 flex flex-col">
                
                {/* Executive Header */}
                <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center gap-4 px-5 py-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 active:scale-95 transition-all shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">Notification Hub</h1>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Updates & Bulletins
                        </p>
                    </div>
                </header>

                <main className="flex-1 px-5 pt-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gathering Updates...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[70vh] text-center p-8 space-y-6">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
                                <Inbox className="w-10 h-10 text-slate-300 relative z-10" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 mb-2">Zero Interruption</h3>
                                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                                    Your dashboard is clear. We'll alert you here when important updates arrive.
                                </p>
                            </div>
                            <Button 
                                variant="outline" 
                                className="rounded-2xl bg-white border-slate-200 text-slate-600 font-black h-12 px-8 shadow-sm active:scale-95 transition-all"
                                onClick={() => navigate('/home')}
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <AnimatePresence>
                                {notifications.map((notif, idx) => (
                                    <motion.div
                                        key={notif.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="relative group"
                                    >
                                        <div className={cn(
                                            "relative bg-white rounded-3xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md",
                                            notif.type === 'rejection' ? "border-rose-100 hover:border-rose-200" : "border-slate-100 hover:border-blue-100"
                                        )}>
                                            <div className="flex gap-4">
                                                {/* Icon Pillar */}
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                                    notif.color === 'rose' ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
                                                )}>
                                                    <notif.icon className="w-6 h-6" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1 gap-2">
                                                        <h3 className="font-black text-slate-900 text-[15px] tracking-tight leading-tight">
                                                            {notif.title}
                                                        </h3>
                                                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap pt-0.5">
                                                            {new Date(notif.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-[12px] font-medium text-slate-500 leading-relaxed line-clamp-2 mb-4">
                                                        {notif.content}
                                                    </p>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-3">
                                                        {notif.cta_text && (
                                                            <button 
                                                                onClick={() => {
                                                                    if (notif.cta_link?.startsWith('http')) {
                                                                        window.open(notif.cta_link, '_blank');
                                                                    } else if (notif.cta_link) {
                                                                        navigate(notif.cta_link);
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2",
                                                                    notif.type === 'rejection' 
                                                                        ? "bg-rose-600 text-white hover:bg-rose-700" 
                                                                        : "bg-slate-900 text-white hover:bg-slate-800"
                                                                )}
                                                            >
                                                                {notif.cta_text}
                                                                <ArrowRight className="w-3 h-3" />
                                                            </button>
                                                        )}
                                                        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                            <Calendar className="w-3 h-3" />
                                                            {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Trust Footer */}
                            <div className="pt-12 pb-8 flex flex-col items-center opacity-30 select-none">
                                <div className="h-[1px] w-12 bg-slate-300 mb-4" />
                                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 text-center italic">
                                    Official Communication
                                </p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default NotificationsPage;
