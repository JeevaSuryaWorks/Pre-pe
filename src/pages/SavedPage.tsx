import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Heart,
    Users,
    Plus,
    Smartphone,
    Tv,
    Lightbulb,
    Flame,
    Droplet,
    Wifi,
    Search,
    Loader2,
    Trash2,
    Zap,
    Send,
    UserCheck,
    CreditCard,
    ArrowRight,
    Calendar,
    AlertCircle,
    MessageSquare
} from 'lucide-react';
import { getSavedItems, removeSavedItem, updateSavedItem, type SavedItem } from '@/services/saved.service';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { AddCircleMemberDialog } from '@/components/saved/AddCircleMemberDialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SavedPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const calculateDaysLeft = (dueDateStr: string | null | undefined, now: Date = new Date()) => {
        if (!dueDateStr) {
            return { 
                text: "No due date", 
                colorClass: "text-slate-400 font-black uppercase tracking-wider", 
                bgClass: "bg-slate-50 border-slate-100 text-slate-400",
                status: 'none'
            };
        }
        
        const dueDate = new Date(dueDateStr);
        
        const dueDateMidnight = new Date(dueDate);
        dueDateMidnight.setHours(0, 0, 0, 0);
        
        const todayMidnight = new Date(now);
        todayMidnight.setHours(0, 0, 0, 0);
        
        const diffTime = dueDateMidnight.getTime() - todayMidnight.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            const absDays = Math.abs(diffDays);
            return {
                text: `Overdue by ${absDays} ${absDays === 1 ? 'Day' : 'Days'}`,
                colorClass: "text-rose-600 font-black uppercase tracking-wider",
                bgClass: "bg-rose-50/50 border-rose-200 text-rose-800",
                status: 'overdue'
            };
        } else if (diffDays === 0) {
            const hoursLeft = 23 - now.getHours();
            const minLeft = 59 - now.getMinutes();
            const secLeft = 59 - now.getSeconds();
            
            const formattedHours = String(hoursLeft).padStart(2, '0');
            const formattedMin = String(minLeft).padStart(2, '0');
            const formattedSec = String(secLeft).padStart(2, '0');
            
            const timeLeftStr = `${formattedHours}h ${formattedMin}m ${formattedSec}s left`;
            
            return {
                text: `Due Today (${timeLeftStr})`,
                colorClass: "text-rose-600 font-black uppercase tracking-wider animate-pulse",
                bgClass: "bg-rose-50/50 border-rose-200 text-rose-800",
                status: 'today'
            };
        } else {
            return {
                text: `${diffDays} ${diffDays === 1 ? 'Day' : 'Days'} Left`,
                colorClass: "text-[#046A38] font-black uppercase tracking-wider",
                bgClass: "bg-emerald-50/50 border-emerald-200 text-emerald-800",
                status: 'upcoming'
            };
        }
    };

    const loadData = async () => {
        if (user) {
            setLoading(true);
            try {
                const items = await getSavedItems(user.id);
                setSavedItems(items);
            } catch (err) {
                console.error("Failed to load saved items", err);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleDelete = async (id: string) => {
        const success = await removeSavedItem(id);
        if (success) {
            setSavedItems(prev => prev.filter(item => item.id !== id));
            toast({ title: "Removed successfully", description: "The item has been deleted from your circle." });
        }
    };

    const handleUpdateDueDate = async (item: SavedItem, dateStr: string) => {
        if (!dateStr) {
            toast({
                title: "Date Required",
                description: "Payment Due Date is compulsory and cannot be empty.",
                variant: "destructive"
            });
            return;
        }

        const updatedMetadata = {
            ...(item.metadata || {}),
            due_date: dateStr
        };
        
        // Optimistic UI Update
        setSavedItems(prev => prev.map(i => i.id === item.id ? { ...i, metadata: updatedMetadata } : i));
        
        const updatedItem = await updateSavedItem(item.id, { metadata: updatedMetadata });
        if (updatedItem) {
            toast({
                title: "Due Date Updated",
                description: dateStr ? `Due date set to ${format(new Date(dateStr), 'MMM d, yyyy')}` : "Due date removed"
            });
        } else {
            // Rollback
            loadData();
            toast({
                title: "Update Failed",
                description: "Could not save changes to database.",
                variant: "destructive"
            });
        }
    };

    const handleToggleAutopay = async (item: SavedItem) => {
        const active = !item.metadata?.autopay_active;
        const updatedMetadata = {
            ...(item.metadata || {}),
            autopay_active: active
        };
        
        // Optimistic UI Update
        setSavedItems(prev => prev.map(i => i.id === item.id ? { ...i, metadata: updatedMetadata } : i));
        
        const updatedItem = await updateSavedItem(item.id, { metadata: updatedMetadata });
        if (updatedItem) {
            toast({
                title: active ? "Autopay Activated" : "Autopay Deactivated",
                description: active ? "Automatic wallet debits are now active for this favorite." : "Automatic wallet debits are now disabled."
            });
        } else {
            // Rollback
            loadData();
            toast({
                title: "Update Failed",
                description: "Could not save changes to database.",
                variant: "destructive"
            });
        }
    };

    const handleToggleWhatsApp = async (item: SavedItem) => {
        const active = !item.metadata?.whatsapp_reminder_active;
        const updatedMetadata = {
            ...(item.metadata || {}),
            whatsapp_reminder_active: active
        };
        
        // Optimistic UI Update
        setSavedItems(prev => prev.map(i => i.id === item.id ? { ...i, metadata: updatedMetadata } : i));
        
        const updatedItem = await updateSavedItem(item.id, { metadata: updatedMetadata });
        if (updatedItem) {
            toast({
                title: active ? "WhatsApp Reminders Enabled" : "WhatsApp Reminders Disabled",
                description: active ? "Pre-due alert reminders will be sent to your WhatsApp." : "WhatsApp reminder alerts are now disabled."
            });
        } else {
            // Rollback
            loadData();
            toast({
                title: "Update Failed",
                description: "Could not save changes to database.",
                variant: "destructive"
            });
        }
    };

    const getServiceIconAndColor = (serviceType: string) => {
        switch (serviceType) {
            case 'MOBILE_PREPAID':
            case 'MOBILE_POSTPAID':
                return {
                    icon: <Smartphone className="h-6 w-6" />,
                    gradient: "from-blue-500 to-indigo-600 shadow-blue-200",
                    bgLight: "bg-blue-50 text-blue-600"
                };
            case 'DTH':
                return {
                    icon: <Tv className="h-6 w-6" />,
                    gradient: "from-purple-500 to-pink-600 shadow-purple-200",
                    bgLight: "bg-purple-50 text-purple-600"
                };
            case 'ELECTRICITY':
                return {
                    icon: <Lightbulb className="h-6 w-6" />,
                    gradient: "from-amber-400 to-orange-500 shadow-amber-200",
                    bgLight: "bg-amber-50 text-amber-600"
                };
            case 'GAS':
                return {
                    icon: <Flame className="h-6 w-6" />,
                    gradient: "from-rose-500 to-red-600 shadow-rose-200",
                    bgLight: "bg-rose-50 text-rose-600"
                };
            case 'WATER':
                return {
                    icon: <Droplet className="h-6 w-6" />,
                    gradient: "from-sky-400 to-blue-500 shadow-sky-200",
                    bgLight: "bg-sky-50 text-sky-600"
                };
            case 'BROADBAND':
                return {
                    icon: <Wifi className="h-6 w-6" />,
                    gradient: "from-teal-400 to-emerald-500 shadow-teal-200",
                    bgLight: "bg-teal-50 text-teal-600"
                };
            default:
                return {
                    icon: <Zap className="h-6 w-6" />,
                    gradient: "from-indigo-500 to-purple-600 shadow-indigo-200",
                    bgLight: "bg-indigo-50 text-indigo-600"
                };
        }
    };

    const handleAction = (item: SavedItem) => {
        switch (item.service_type) {
            case 'MOBILE_PREPAID':
                navigate('/mobile-recharge', { state: { mobileNumber: item.account_id } });
                break;
            case 'DTH':
                navigate('/dth-recharge', { state: { dthId: item.account_id } });
                break;
            case 'ELECTRICITY':
                navigate('/services/electricity', { state: { consumerId: item.account_id } });
                break;
            default:
                navigate('/services');
        }
    };

    // Filter items based on search query
    const filteredItems = savedItems.filter(item => 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.account_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.service_type?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const circleItems = filteredItems.filter(i => i.category === 'CIRCLE');
    const favoriteItems = filteredItems.filter(i => i.category === 'FAVORITE');

    return (
        <Layout title="PrePe Circle" showBottomNav>
            <div className="min-h-screen bg-slate-50/50 pb-28">
                {/* Visual Accent Gradients */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF671F]/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-40 left-0 w-80 h-80 bg-[#046A38]/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="container max-w-xl mx-auto px-4 pt-6 space-y-6 relative z-10">
                    {/* Header Banner */}
                    <div className="bg-white rounded-[32px] p-7 shadow-xl shadow-slate-900/[0.03] border border-slate-100 backdrop-blur-xl relative overflow-hidden">
                        {/* Dynamic Tricolor Accent Glowing Circles */}
                        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br from-[#FF671F]/10 via-[#046A38]/5 to-transparent rounded-full pointer-events-none blur-xl animate-pulse" />
                        <div className="absolute -left-10 top-0 w-24 h-24 bg-gradient-to-tr from-[#FF671F]/5 to-transparent rounded-full pointer-events-none blur-lg" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF671F] bg-[#FF671F]/10 px-3.5 py-1.5 rounded-full w-fit block shadow-sm border border-[#FF671F]/10">
                                    Digital Directory
                                </span>
                                <h1 className="text-2xl font-black text-[#000080] tracking-tight leading-none pt-1">PrePe Circle</h1>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">Your family, friends & saved payment links</p>
                            </div>
                            <Button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-[#FF671F] via-[#FF8040] to-orange-600 hover:scale-102 hover:shadow-xl shadow-lg shadow-orange-500/20 active:scale-98 transition-all duration-300 uppercase tracking-widest text-[9px] font-black h-13 px-5 shrink-0 flex items-center justify-center gap-1.5 border border-[#FF8040]/30 select-none animate-in fade-in zoom-in duration-500"
                            >
                                <Plus className="w-4 h-4 text-white animate-pulse" strokeWidth={3} /> Add More & Get More Rewards
                            </Button>
                        </div>

                        {/* High-visibility Glassmorphic Search Input */}
                        <div className="relative mt-7 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#FF671F] transition-colors" />
                            <Input
                                placeholder="Search by name, number, or category..."
                                className="pl-11.5 h-13 bg-slate-50 border border-slate-200/60 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-semibold focus:border-[#FF671F] focus:bg-white focus:ring-4 focus:ring-[#FF671F]/5 transition-all shadow-inner"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <Tabs defaultValue="circle" className="w-full">
                        {/* Custom Styled High-Contrast Tabs List */}
                        <TabsList className="w-full grid grid-cols-2 p-1.5 bg-white border border-slate-200/60 shadow-sm rounded-2xl mb-6 h-14">
                            <TabsTrigger 
                                value="circle" 
                                className="rounded-xl font-black text-xs transition-all uppercase tracking-widest text-slate-400 data-[state=active]:bg-[#046A38] data-[state=active]:text-white data-[state=active]:shadow-md"
                            >
                                <Users className="w-4 h-4 mr-2" /> My Circle ({circleItems.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="favorites" 
                                className="rounded-xl font-black text-xs transition-all uppercase tracking-widest text-slate-400 data-[state=active]:bg-[#FF671F] data-[state=active]:text-white data-[state=active]:shadow-md"
                            >
                                <Heart className="w-4 h-4 mr-2" /> Favorites ({favoriteItems.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* --- TAB CONTENT: CIRCLE --- */}
                        <TabsContent value="circle" className="space-y-4 outline-none">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                                    <Loader2 className="h-10 w-10 animate-spin text-[#000080]" />
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Circle...</p>
                                </div>
                            ) : circleItems.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-16 px-6 rounded-[36px] border-3 border-dashed border-slate-200 bg-white shadow-sm flex flex-col items-center"
                                >
                                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                                        <Users className="w-10 h-10 text-[#046A38]" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800">Your Circle is Empty</h3>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 mb-6 font-medium leading-relaxed">
                                        Add family members, friends, or regular clients to quickly process their mobile recharges and utility bills in a single tap!
                                    </p>
                                    <Button 
                                        onClick={() => setIsAddDialogOpen(true)} 
                                        className="rounded-2xl bg-[#046A38] hover:bg-green-700 text-white font-black px-8 h-12 shadow-md shadow-green-700/10 active:scale-95 transition-all text-xs uppercase tracking-widest"
                                    >
                                        Add First Member
                                    </Button>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {circleItems.map((item, idx) => {
                                            const styling = getServiceIconAndColor(item.service_type);
                                            const isOverdue = item.metadata?.due_date && new Date(item.metadata.due_date) < new Date(new Date().setHours(0,0,0,0));
                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                                >
                                                    <Card className="overflow-hidden rounded-[28px] border-none shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#046A38]/10 transition-all bg-white relative">
                                                        <div className="p-5">
                                                            <div className="flex items-center justify-between gap-4">
                                                                {/* Custom Dynamic Avatar Icon */}
                                                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg text-white bg-gradient-to-br", styling.gradient)}>
                                                                    {styling.icon}
                                                                </div>

                                                                {/* User and Account details */}
                                                                <div className="flex-1 min-w-0 pr-1">
                                                                    <div className="flex flex-col">
                                                                        <h4 className="text-base font-black text-slate-900 truncate leading-snug" title={item.title}>
                                                                            {item.title}
                                                                        </h4>
                                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                                            <Badge className={cn("text-[9px] font-black uppercase tracking-wider border-none px-2.5 py-0.5", styling.bgLight)}>
                                                                                {item.service_type.replace('_', ' ')}
                                                                            </Badge>
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-xs font-mono font-bold text-slate-500 mt-2 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100/80 inline-block">
                                                                        {item.account_id}
                                                                    </p>
                                                                </div>

                                                                {/* Directly Visible Mobile-Friendly Actions */}
                                                                <div className="flex flex-col gap-2 shrink-0 items-end">
                                                                    {(() => {
                                                                        const daysInfo = calculateDaysLeft(item.metadata?.due_date, currentTime);
                                                                        let btnStyle = "from-[#046A38] to-green-700 shadow-green-700/10 hover:shadow-green-700/20";
                                                                        let effects = "";
                                                                        let label = "Pay";
                                                                        
                                                                        if (daysInfo.status === 'overdue') {
                                                                            btnStyle = "from-red-600 to-rose-700 shadow-red-700/20 hover:shadow-red-700/30 animate-pulse border border-red-300/40";
                                                                            effects = "animate-bounce hover:animate-none";
                                                                            label = "Pay Overdue";
                                                                        } else if (daysInfo.status === 'today') {
                                                                            btnStyle = "from-amber-500 to-orange-600 shadow-amber-600/20 hover:shadow-amber-600/30 border border-amber-300/40";
                                                                            effects = "animate-pulse";
                                                                            label = "Pay Today";
                                                                        }
                                                                        
                                                                        return (
                                                                            <Button
                                                                                onClick={() => handleAction(item)}
                                                                                className={cn(
                                                                                    "rounded-2xl bg-gradient-to-r text-white font-black text-[10px] uppercase tracking-widest hover:opacity-95 h-10 px-4 transition-all flex items-center gap-1.5 active:scale-95 shadow-md",
                                                                                    btnStyle,
                                                                                    effects
                                                                                )}
                                                                            >
                                                                                {label} <Send className="w-3 h-3" />
                                                                            </Button>
                                                                        );
                                                                    })()}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setItemToDelete(item.id)}
                                                                        className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-100 bg-slate-50/50"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Sleek inline divider */}
                                                            <div className="border-t border-slate-100 my-4" />

                                                            {/* Dynamic Controls Grid */}
                                                            <div className="flex flex-col gap-3">
                                                                {/* Due Date picker */}
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-2 text-slate-600">
                                                                        <Calendar className="w-4.5 h-4.5 text-[#046A38]" />
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Due Date</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isOverdue && (
                                                                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1">
                                                                                <AlertCircle className="w-3.5 h-3.5" /> Overdue
                                                                            </span>
                                                                        )}
                                                                        <input
                                                                            type="date"
                                                                            value={item.metadata?.due_date || ""}
                                                                            disabled={true}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none transition-all font-mono cursor-not-allowed"
                                                                        />
                                                                    </div>
                                                                </div>

                                                                {/* Days Left Display */}
                                                                {(() => {
                                                                    const daysInfo = calculateDaysLeft(item.metadata?.due_date, currentTime);
                                                                    return (
                                                                        <div className={cn(
                                                                            "flex items-center justify-between p-3 rounded-2xl border transition-all select-none",
                                                                            daysInfo.bgClass
                                                                        )}>
                                                                            <div className="flex items-center gap-2.5">
                                                                                <Calendar className={cn("w-4.5 h-4.5 shrink-0", 
                                                                                    daysInfo.text.includes("Overdue") || daysInfo.text.includes("Today") ? "text-rose-500" : 
                                                                                    daysInfo.text.includes("Left") ? "text-[#046A38]" : "text-slate-400"
                                                                                )} />
                                                                                <div className="flex flex-col text-left">
                                                                                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">Status</span>
                                                                                    <span className={cn("text-[10px] leading-none mt-1", daysInfo.colorClass)}>{daysInfo.text}</span>
                                                                                </div>
                                                                            </div>
                                                                            {item.metadata?.whatsapp_reminder_active && (
                                                                                <Badge className="bg-[#046A38]/10 text-[#046A38] border-none p-1.5 rounded-full flex items-center justify-center select-none shrink-0 w-6 h-6" title="WhatsApp Alerts Active">
                                                                                    <MessageSquare className="w-3.5 h-3.5 fill-current" />
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })()}
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </TabsContent>

                        {/* --- TAB CONTENT: FAVORITES --- */}
                        <TabsContent value="favorites" className="space-y-4 outline-none">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-[32px] border border-slate-100 shadow-sm">
                                    <Loader2 className="h-10 w-10 animate-spin text-[#000080]" />
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Favorites...</p>
                                </div>
                            ) : favoriteItems.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-16 px-6 rounded-[36px] border-3 border-dashed border-slate-200 bg-white shadow-sm flex flex-col items-center"
                                >
                                    <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
                                        <Heart className="w-10 h-10 text-rose-500 fill-current" />
                                    </div>
                                    <h3 className="text-lg font-black text-slate-800">No Favorites Saved</h3>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 mb-6 font-medium leading-relaxed">
                                        Mark your recurring transactions as favorites directly from your transaction history page to perform seamless repetitions.
                                    </p>
                                    <Button 
                                        onClick={() => navigate('/transactions')} 
                                        className="rounded-2xl bg-[#FF671F] hover:bg-orange-600 text-white font-black px-8 h-12 shadow-md shadow-orange-600/10 active:scale-95 transition-all text-xs uppercase tracking-widest"
                                    >
                                        View History
                                    </Button>
                                </motion.div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {favoriteItems.map((item, idx) => {
                                            const styling = getServiceIconAndColor(item.service_type);
                                            const isOverdue = item.metadata?.due_date && new Date(item.metadata.due_date) < new Date(new Date().setHours(0,0,0,0));
                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                                >
                                                    <Card className="rounded-[28px] border-none shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#FF671F]/10 transition-all bg-white relative overflow-hidden">
                                                        <div className="p-5">
                                                            <div className="flex items-center justify-between gap-4">
                                                                {/* Dynamic Service Icon with Heart Badge */}
                                                                <div className="relative shrink-0">
                                                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg text-white bg-gradient-to-br", styling.gradient)}>
                                                                        {styling.icon}
                                                                    </div>
                                                                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center shadow-sm">
                                                                        <Heart className="w-3 h-3 fill-current text-white animate-pulse" />
                                                                    </div>
                                                                </div>

                                                                {/* Favorite Title & Amount Info */}
                                                                <div className="flex-1 min-w-0 pr-1">
                                                                    <h4 className="text-base font-black text-slate-900 truncate leading-snug" title={item.title}>
                                                                        {item.title}
                                                                    </h4>
                                                                    
                                                                    <div className="flex items-center gap-2 mt-2">
                                                                        <span className="text-xs font-black text-[#046A38] bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100/50">
                                                                            ₹{item.metadata?.amount || 'N/A'}
                                                                        </span>
                                                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                            {format(new Date(item.created_at), 'MMM d, yyyy')}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Mobile Actions */}
                                                                <div className="flex flex-col gap-2 shrink-0 items-end">
                                                                    {(() => {
                                                                        const daysInfo = calculateDaysLeft(item.metadata?.due_date, currentTime);
                                                                        let btnStyle = "from-[#FF671F] to-orange-600 shadow-orange-700/10 hover:shadow-orange-700/20";
                                                                        let effects = "";
                                                                        let label = "Repeat";
                                                                        
                                                                        if (daysInfo.status === 'overdue') {
                                                                            btnStyle = "from-red-600 to-rose-700 shadow-red-700/20 hover:shadow-red-700/30 animate-pulse border border-red-300/40";
                                                                            effects = "animate-bounce hover:animate-none";
                                                                            label = "Pay Overdue";
                                                                        } else if (daysInfo.status === 'today') {
                                                                            btnStyle = "from-amber-500 to-orange-600 shadow-amber-600/20 hover:shadow-amber-600/30 border border-amber-300/40";
                                                                            effects = "animate-pulse";
                                                                            label = "Pay Today";
                                                                        }
                                                                        
                                                                        return (
                                                                            <Button
                                                                                onClick={() => handleAction(item)}
                                                                                className={cn(
                                                                                    "rounded-2xl bg-gradient-to-r text-white font-black text-[10px] uppercase tracking-widest hover:opacity-95 h-10 px-4 transition-all flex items-center gap-1.5 active:scale-95 shadow-md",
                                                                                    btnStyle,
                                                                                    effects
                                                                                )}
                                                                            >
                                                                                {label} <ArrowRight className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        );
                                                                    })()}
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => setItemToDelete(item.id)}
                                                                        className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-100 bg-slate-50/50"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            {/* Sleek inline divider */}
                                                            <div className="border-t border-slate-100 my-4" />

                                                            {/* Dynamic Controls Grid */}
                                                            <div className="flex flex-col gap-3">
                                                                {/* Due Date picker */}
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="flex items-center gap-2 text-slate-600">
                                                                        <Calendar className="w-4.5 h-4.5 text-[#000080]" />
                                                                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Due Date</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {isOverdue && (
                                                                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase tracking-wider animate-pulse flex items-center gap-1">
                                                                                <AlertCircle className="w-3.5 h-3.5" /> Overdue
                                                                            </span>
                                                                        )}
                                                                        <input
                                                                            type="date"
                                                                            value={item.metadata?.due_date || ""}
                                                                            disabled={true}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none transition-all font-mono cursor-not-allowed"
                                                                        />
                                                                    </div>
                                                                </div>                                                                {/* AutoPay and Days Left */}
                                                                <div className="grid grid-cols-2 gap-3 mt-1">
                                                                    {/* Autopay Toggle */}
                                                                    <div 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleToggleAutopay(item);
                                                                        }}
                                                                        className={cn(
                                                                            "flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none",
                                                                            item.metadata?.autopay_active 
                                                                                ? "bg-indigo-50/50 border-indigo-200 text-[#000080]" 
                                                                                : "bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50"
                                                                        )}
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <CreditCard className={cn("w-4 h-4 shrink-0", item.metadata?.autopay_active ? "text-indigo-600" : "text-slate-400")} />
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[10px] font-black uppercase tracking-wider">Autopay</span>
                                                                                <span className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">Auto-debit</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className={cn(
                                                                            "w-8 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0",
                                                                            item.metadata?.autopay_active ? "bg-indigo-600" : "bg-slate-200"
                                                                        )}>
                                                                            <div className={cn(
                                                                                "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200",
                                                                                item.metadata?.autopay_active ? "translate-x-3" : "translate-x-0"
                                                                            )} />
                                                                        </div>
                                                                    </div>

                                                                    {/* Days Left Display */}
                                                                    {(() => {
                                                                        const daysInfo = calculateDaysLeft(item.metadata?.due_date, currentTime);
                                                                        return (
                                                                            <div className={cn(
                                                                                "flex items-center justify-between p-3 rounded-2xl border transition-all select-none",
                                                                                daysInfo.bgClass
                                                                            )}>
                                                                                <div className="flex items-center gap-2">
                                                                                    <Calendar className={cn("w-4 h-4 shrink-0", 
                                                                                        daysInfo.text.includes("Overdue") || daysInfo.text.includes("Today") ? "text-rose-500" : 
                                                                                        daysInfo.text.includes("Left") ? "text-[#FF671F]" : "text-slate-400"
                                                                                    )} />
                                                                                    <div className="flex flex-col text-left">
                                                                                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 leading-none">Status</span>
                                                                                        <span className={cn("text-[10px] leading-none mt-0.5", daysInfo.colorClass)}>{daysInfo.text}</span>
                                                                                    </div>
                                                                                </div>
                                                                                {item.metadata?.whatsapp_reminder_active && (
                                                                                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none p-1 rounded-full flex items-center justify-center shrink-0 w-5 h-5" title="WhatsApp Alerts Active">
                                                                                        <MessageSquare className="w-3 h-3 fill-current" />
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <AddCircleMemberDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSuccess={loadData}
                userId={user?.id || ''}
            />

            <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <AlertDialogContent className="rounded-[32px] p-8 border-none shadow-2xl bg-white max-w-sm">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
                            <Trash2 className="w-8 h-8 text-rose-600 animate-bounce" />
                        </div>
                        <AlertDialogTitle className="text-xl font-black text-slate-900 tracking-tight">Delete Circle Member?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 font-medium text-xs leading-relaxed mt-2 text-center">
                            Are you absolutely sure you want to remove this member from your circle? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex flex-row gap-3 pt-4 justify-center w-full">
                        <AlertDialogCancel 
                            onClick={() => setItemToDelete(null)}
                            className="flex-1 rounded-xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50 h-12"
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={async () => {
                                if (itemToDelete) {
                                    await handleDelete(itemToDelete);
                                    setItemToDelete(null);
                                }
                            }}
                            className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black h-12 shadow-lg shadow-rose-600/10"
                        >
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Layout>
    );
};

export default SavedPage;
