import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
    Bell, ChevronLeft, Megaphone, ShieldAlert, 
    Calendar, Inbox, Loader2, Info, ArrowRight,
    CircleCheck, AlertCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { notificationsService, NotificationItem } from '@/services/notifications.service';

const NotificationsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationsService.fetchNotifications(user.id);
            setNotifications(data);
            if (data && data.length > 0) {
                const ids = data.map(n => n.id);
                notificationsService.dismissAllNotifications(ids);
            }
        } catch (err) {
            console.error("Global notification fetch failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDismiss = (id: string) => {
        notificationsService.dismissNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
        toast({
            title: "Notification Dismissed",
            description: "It has been removed from your active bulletins.",
        });
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
                                            notif.type === 'rejection' 
                                                ? "border-rose-100 hover:border-rose-200" 
                                                : notif.type === 'approval'
                                                    ? "border-emerald-100 hover:border-emerald-200"
                                                    : "border-slate-100 hover:border-blue-100"
                                        )}>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDismiss(notif.id);
                                                }}
                                                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:scale-90 transition-all z-20 shadow-sm"
                                                title="Dismiss Notification"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                            <div className="flex gap-4">
                                                {/* Icon Pillar */}
                                                <div className={cn(
                                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                                                    notif.color === 'rose' 
                                                        ? "bg-rose-50 text-rose-600" 
                                                        : notif.color === 'emerald'
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-blue-50 text-blue-600"
                                                )}>
                                                    <notif.icon className="w-6 h-6" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1 gap-2 pr-6">
                                                        <h3 className="font-black text-slate-900 text-[15px] tracking-tight leading-tight">
                                                            {notif.title}
                                                        </h3>
                                                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap pt-0.5">
                                                            {new Date(notif.date).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-[12px] font-medium text-slate-500 leading-relaxed mb-4">
                                                        {notif.content.split('\n').map((line, lIdx) => {
                                                            if (line.startsWith('•')) {
                                                                return (
                                                                    <div key={lIdx} className="flex items-center gap-2 mt-1.5 pl-1.5 text-slate-600">
                                                                        <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                                        <span className="font-semibold text-[11px] text-slate-600">{line.substring(1).trim()}</span>
                                                                    </div>
                                                                );
                                                            }
                                                            return (
                                                                <p 
                                                                    key={lIdx} 
                                                                    className={cn(
                                                                        lIdx > 0 && "mt-3 font-black text-slate-800 uppercase tracking-widest text-[9px] flex items-center gap-1.5 text-blue-600 border-t border-slate-100 pt-3"
                                                                    )}
                                                                >
                                                                    {line}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>

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
                                                                        : notif.type === 'approval'
                                                                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
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
