import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    MessageSquare,
    Gift,
    Edit2,
    Settings
} from 'lucide-react';
import { getSavedItems, removeSavedItem, updateSavedItem, type SavedItem, addSavedItem } from '@/services/saved.service';
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

    const [familyName, setFamilyName] = useState<string | null>(null);
    const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
    const [familyInput, setFamilyInput] = useState("");
    const [isEditingFamilyName, setIsEditingFamilyName] = useState(false);

    // For editing saved items
    const [editingItem, setEditingItem] = useState<SavedItem | null>(null);
    const [editFormData, setEditFormData] = useState({
        title: "",
        service_type: "",
        account_id: "",
        due_date: ""
    });

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

    const getRewardsPointsInfo = (dueDateStr: string | null | undefined) => {
        const daysInfo = calculateDaysLeft(dueDateStr, currentTime);
        if (daysInfo.status === 'overdue') {
            return {
                text: "Payoverdue & 20 Rewards Points",
                colorClass: "text-rose-600 bg-rose-50/50 border-rose-200 text-rose-800",
                iconColor: "text-rose-500"
            };
        } else if (daysInfo.status === 'today') {
            return {
                text: "Pay Today & Get 25 Rewards",
                colorClass: "text-amber-700 bg-amber-50/50 border-amber-200 text-amber-800",
                iconColor: "text-amber-500 animate-pulse"
            };
        } else {
            return {
                text: "Pay Now & Get 30 Points",
                colorClass: "text-[#046A38] bg-emerald-50/50 border-emerald-200 text-emerald-800",
                iconColor: "text-emerald-600"
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
        if (user) {
            const storedFamily = localStorage.getItem(`prepe_family_name_${user.id}`);
            if (storedFamily) {
                setFamilyName(storedFamily);
            } else {
                setIsFamilyModalOpen(true);
            }
        }
    }, [user]);

    const handleSaveFamilyName = async () => {
        if (!familyInput.trim() || !user) return;
        const trimmed = familyInput.trim();
        setLoading(true);
        try {
            // Preset dates: 15, 20, 25 days out, or 28-10-2027 for Broadband
            const presets = [
                {
                    title: "Mobile Recharge",
                    service_type: "MOBILE_PREPAID",
                    account_id: "9999999999",
                    category: "CIRCLE" as const,
                    user_id: user.id,
                    metadata: {
                        is_preset: true,
                        due_date: format(new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                        whatsapp_reminder_active: true,
                    }
                },
                {
                    title: "Electricity Bill",
                    service_type: "ELECTRICITY",
                    account_id: "1234567890",
                    category: "CIRCLE" as const,
                    user_id: user.id,
                    metadata: {
                        is_preset: true,
                        due_date: format(new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                        whatsapp_reminder_active: true,
                    }
                },
                {
                    title: "Gas Bill",
                    service_type: "GAS",
                    account_id: "9876543210",
                    category: "CIRCLE" as const,
                    user_id: user.id,
                    metadata: {
                        is_preset: true,
                        due_date: format(new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
                        whatsapp_reminder_active: true,
                    }
                },
                {
                    title: "Broadband Bill",
                    service_type: "BROADBAND",
                    account_id: "866875429",
                    category: "CIRCLE" as const,
                    user_id: user.id,
                    metadata: {
                        is_preset: true,
                        due_date: "2027-10-28", // matches screenshot
                        whatsapp_reminder_active: true,
                    }
                }
            ];

            for (const preset of presets) {
                await addSavedItem(preset);
            }

            localStorage.setItem(`prepe_family_name_${user.id}`, trimmed);
            setFamilyName(trimmed);
            setIsFamilyModalOpen(false);

            toast({
                title: `Welcome to PrePe Family - ${trimmed}!`,
                description: "Your standard billing presets have been automatically set up.",
            });

            await loadData();
        } catch (err) {
            console.error("Failed to add preset items", err);
            toast({
                title: "Setup Failed",
                description: "Could not create billing presets.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateFamilyName = () => {
        if (!familyInput.trim() || !user) return;
        const trimmed = familyInput.trim();
        localStorage.setItem(`prepe_family_name_${user.id}`, trimmed);
        setFamilyName(trimmed);
        setIsEditingFamilyName(false);
        toast({
            title: "Family Name Updated",
            description: `Renamed to PrePe Family - ${trimmed}.`
        });
    };

    const handleEditItem = (item: SavedItem) => {
        setEditingItem(item);
        setEditFormData({
            title: item.title,
            service_type: item.service_type,
            account_id: item.account_id,
            due_date: item.metadata?.due_date || ""
        });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;

        if (!editFormData.account_id || !editFormData.due_date) {
            toast({
                title: "Validation Error",
                description: "Number/ID and Payment Due Date are required.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const updatedMetadata = {
                ...(editingItem.metadata || {}),
                due_date: editFormData.due_date
            };

            const updates: Partial<SavedItem> = {
                account_id: editFormData.account_id,
                metadata: updatedMetadata
            };

            if (!editingItem.metadata?.is_preset) {
                updates.title = editFormData.title;
                updates.service_type = editFormData.service_type;
            }

            const result = await updateSavedItem(editingItem.id, updates);
            if (result) {
                toast({
                    title: "Updated Successfully",
                    description: "The item details have been saved."
                });
                setEditingItem(null);
                await loadData();
            } else {
                toast({
                    title: "Update Failed",
                    description: "Could not save details to database.",
                    variant: "destructive"
                });
            }
        } catch (err) {
            console.error("Failed to edit saved item", err);
            toast({
                title: "Update Failed",
                description: "An unexpected error occurred.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

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
        let bonusPoints = 30; // Default flat 30 points when due date is more or none
        const daysInfo = calculateDaysLeft(item.metadata?.due_date, currentTime);
        if (daysInfo.status === 'today') {
            bonusPoints = 25;
        } else if (daysInfo.status === 'overdue') {
            bonusPoints = 20;
        }

        // Set pending favorite bonus points in sessionStorage
        sessionStorage.setItem('prepe_pending_favorite_bonus_points', bonusPoints.toString());
        sessionStorage.setItem('prepe_pending_favorite_id', item.id);

        switch (item.service_type) {
            case 'MOBILE_PREPAID':
                navigate('/mobile-recharge', { state: { mobileNumber: item.account_id, fromFavorite: true, favoriteId: item.id } });
                break;
            case 'MOBILE_POSTPAID':
                navigate('/postpaid', { state: { mobileNumber: item.account_id, operatorId: item.metadata?.operator_id, fromFavorite: true, favoriteId: item.id } });
                break;
            case 'DTH': {
                const operatorId = item.metadata?.operator_id || item.metadata?.operator || item.operator_id;
                if (operatorId) {
                    navigate(`/dth-recharge/enter-details?operator=${operatorId}`, { state: { dthId: item.account_id, fromFavorite: true, favoriteId: item.id } });
                } else {
                    navigate('/dth-recharge', { state: { dthId: item.account_id, fromFavorite: true, favoriteId: item.id } });
                }
                break;
            }
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
        <Layout title="PrePe Family & Favorites" showBottomNav>
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
                        
                        <div className="flex flex-col gap-3">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FF671F] bg-[#FF671F]/10 px-3.5 py-1.5 rounded-full w-fit block shadow-sm border border-[#FF671F]/10 select-none">
                                        PrePe Family Circle
                                    </span>
                                    <Button
                                        onClick={() => setIsAddDialogOpen(true)}
                                        className="rounded-full bg-gradient-to-r from-[#FF671F] to-orange-600 hover:scale-102 hover:shadow-md shadow-sm active:scale-98 transition-all duration-300 uppercase tracking-widest text-[8px] font-black h-8 px-3.5 flex items-center justify-center gap-1 border border-orange-400/20"
                                    >
                                        <Plus className="w-3 h-3 text-white" strokeWidth={3} /> Add Preset
                                    </Button>
                                </div>
                                <div className="flex items-center gap-2 pt-1 group">
                                    <h1 className="text-3xl font-black text-[#000080] tracking-tight leading-none">
                                        {familyName ? familyName : "PrePe Family"}
                                    </h1>
                                    {familyName && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setFamilyInput(familyName);
                                                setIsEditingFamilyName(true);
                                            }}
                                            className="w-7 h-7 rounded-md text-slate-400 hover:text-[#000080] hover:bg-slate-100 transition-colors opacity-100 group-hover:opacity-100 focus:opacity-100"
                                            title="Edit Family Name"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 font-semibold tracking-wide">Your family members & quick billing presets</p>
                            </div>
                        </div>

                        {/* High-visibility Glassmorphic Search Input */}
                        <div className="relative mt-7 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-[#FF671F] transition-colors" />
                            <Input
                                placeholder="Search by name, number, or category..."
                                className="pl-12 h-13 bg-slate-50 border border-slate-200/60 rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-semibold focus:border-[#FF671F] focus:bg-white focus:ring-4 focus:ring-[#FF671F]/5 transition-all shadow-inner"
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
                                <Users className="w-4 h-4 mr-2" /> My Family ({circleItems.length})
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
                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Loading Family...</p>
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
                                    <h3 className="text-lg font-black text-slate-800">Your Family is Empty</h3>
                                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-2 mb-6 font-medium leading-relaxed">
                                        Add family members, relations, or billing numbers to quickly process mobile recharges and utility bills in a single tap!
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
                                                    <Card className="overflow-hidden rounded-2xl border-none shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#046A38]/10 transition-all bg-white relative">
                                                        <div className="p-3.5">
                                                            <div className="flex items-center justify-between gap-3">
                                                                {/* Custom Dynamic Avatar Icon */}
                                                                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white bg-gradient-to-br", styling.gradient)}>
                                                                    {styling.icon}
                                                                </div>

                                                                {/* User and Account details */}
                                                                <div className="flex-1 min-w-0 pr-1 text-left">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex flex-col min-w-0">
                                                                            <h4 className="text-sm font-black text-slate-900 truncate leading-snug" title={item.title}>
                                                                                {item.title}
                                                                            </h4>
                                                                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                                                                                <Badge className={cn("text-[8px] font-black uppercase tracking-wider border-none px-2 py-0.5", styling.bgLight)}>
                                                                                    {item.service_type.replace('_', ' ')}
                                                                                </Badge>
                                                                                {item.metadata?.is_preset && (
                                                                                    <Badge className="text-[8px] font-black uppercase tracking-wider border-none px-2 py-0.5 bg-indigo-50 text-indigo-600">
                                                                                        Preset
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Card edit/delete actions */}
                                                                        <div className="flex items-center gap-0.5 shrink-0 -mt-1 ml-1.5">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleEditItem(item);
                                                                                }}
                                                                                className="w-7 h-7 rounded-md text-slate-400 hover:text-[#046A38] hover:bg-emerald-50 transition-colors"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            {!item.metadata?.is_preset && (
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setItemToDelete(item.id);
                                                                                    }}
                                                                                    className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                                    title="Delete"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-[10px] font-mono font-bold text-slate-500 mt-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100/50 inline-block select-all leading-none">
                                                                        {item.account_id}
                                                                    </p>
                                                                </div>

                                                                {/* Directly Visible Mobile-Friendly Actions */}
                                                                <div className="flex flex-col gap-1 shrink-0 items-end justify-center">
                                                                    {(() => {
                                                                        const daysInfo = calculateDaysLeft(item.metadata?.due_date, currentTime);
                                                                        let btnStyle = "from-[#046A38] to-green-700 shadow-green-700/10 hover:shadow-green-700/20";
                                                                        let effects = "";
                                                                        let label = "Pay Now";
                                                                        let points = 30;
                                                                        let pointsColor = "text-[#046A38]";
                                                                        
                                                                        if (daysInfo.status === 'overdue') {
                                                                            btnStyle = "from-red-600 to-rose-700 shadow-red-700/20 hover:shadow-red-700/30 animate-pulse border border-red-300/40";
                                                                            effects = "animate-bounce hover:animate-none";
                                                                            label = "Pay Overdue";
                                                                            points = 20;
                                                                            pointsColor = "text-rose-600";
                                                                        } else if (daysInfo.status === 'today') {
                                                                            btnStyle = "from-amber-500 to-orange-600 shadow-amber-600/20 hover:shadow-amber-600/30 border border-amber-300/40";
                                                                            effects = "animate-pulse";
                                                                            label = "Pay Today";
                                                                            points = 25;
                                                                            pointsColor = "text-amber-600";
                                                                        }
                                                                        
                                                                        return (
                                                                            <>
                                                                                <Button
                                                                                    onClick={() => handleAction(item)}
                                                                                    className={cn(
                                                                                        "rounded-xl bg-gradient-to-r text-white font-black text-[9px] uppercase tracking-wider hover:opacity-95 h-8 px-3 transition-all flex items-center gap-1 active:scale-95 shadow-md shrink-0",
                                                                                        btnStyle,
                                                                                        effects
                                                                                    )}
                                                                                >
                                                                                    {label} <Send className="w-2.5 h-2.5" />
                                                                                </Button>
                                                                                <span className={cn("text-[8px] font-black uppercase tracking-wider mt-1 text-right block pr-1 select-none animate-pulse shrink-0", pointsColor)}>
                                                                                    Get {points} Points
                                                                                </span>
                                                                            </>
                                                                        );
                                                                    })()}
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
                                                                        <div 
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="text-xs font-black text-slate-600 bg-slate-100 border border-slate-200/80 rounded-xl px-3.5 py-1.5 focus:outline-none transition-all font-mono select-all cursor-default"
                                                                        >
                                                                            {item.metadata?.due_date 
                                                                                ? (() => {
                                                                                    const parts = item.metadata.due_date.split('-');
                                                                                    if (parts.length === 3) {
                                                                                        return `${parts[2]}-${parts[1]}-${parts[0]}`;
                                                                                    }
                                                                                    return format(new Date(item.metadata.due_date), 'dd-MM-yyyy');
                                                                                })()
                                                                                : "N/A"
                                                                            }
                                                                        </div>
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
                                                    <Card className="rounded-2xl border-none shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#FF671F]/10 transition-all bg-white relative overflow-hidden">
                                                        <div className="p-3.5">
                                                            <div className="flex items-center justify-between gap-3">
                                                                {/* Dynamic Service Icon with Heart Badge */}
                                                                <div className="relative shrink-0">
                                                                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-md text-white bg-gradient-to-br", styling.gradient)}>
                                                                        {styling.icon}
                                                                    </div>
                                                                    <div className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-rose-500 border border-white flex items-center justify-center shadow-3xs">
                                                                        <Heart className="w-2 h-2 fill-current text-white animate-pulse" />
                                                                    </div>
                                                                </div>

                                                                {/* Favorite Title & Amount Info */}
                                                                <div className="flex-1 min-w-0 pr-1 text-left">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex flex-col min-w-0">
                                                                            <h4 className="text-sm font-black text-slate-900 truncate leading-snug" title={item.title}>
                                                                                {item.title}
                                                                            </h4>
                                                                            
                                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                                <span className="text-[10px] font-black text-[#046A38] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50 leading-none">
                                                                                    ₹{item.metadata?.amount || 'N/A'}
                                                                                </span>
                                                                                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">
                                                                                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* Card edit/delete actions */}
                                                                        <div className="flex items-center gap-0.5 shrink-0 -mt-1 ml-1.5">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleEditItem(item);
                                                                                }}
                                                                                className="w-7 h-7 rounded-md text-slate-400 hover:text-[#FF671F] hover:bg-orange-50 transition-colors"
                                                                                title="Edit"
                                                                            >
                                                                                <Edit2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setItemToDelete(item.id);
                                                                                }}
                                                                                className="w-7 h-7 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                                title="Delete"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Mobile Actions */}
                                                                <div className="flex flex-col gap-1 shrink-0 items-end justify-center">
                                                                    {(() => {
                                                                        const daysInfo = calculateDaysLeft(item.metadata?.due_date, currentTime);
                                                                        let btnStyle = "from-[#FF671F] to-orange-600 shadow-orange-700/10 hover:shadow-orange-700/20";
                                                                        let effects = "";
                                                                        let label = "Repeat";
                                                                        let points = 30;
                                                                        let pointsColor = "text-[#046A38]";
                                                                        
                                                                        if (daysInfo.status === 'overdue') {
                                                                            btnStyle = "from-red-600 to-rose-700 shadow-red-700/20 hover:shadow-red-700/30 animate-pulse border border-red-300/40";
                                                                            effects = "animate-bounce hover:animate-none";
                                                                            label = "Pay Overdue";
                                                                            points = 20;
                                                                            pointsColor = "text-rose-600";
                                                                        } else if (daysInfo.status === 'today') {
                                                                            btnStyle = "from-amber-500 to-orange-600 shadow-amber-600/20 hover:shadow-amber-600/30 border border-amber-300/40";
                                                                            effects = "animate-pulse";
                                                                            label = "Pay Today";
                                                                            points = 25;
                                                                            pointsColor = "text-amber-600";
                                                                        }
                                                                        
                                                                        return (
                                                                            <>
                                                                                <Button
                                                                                    onClick={() => handleAction(item)}
                                                                                    className={cn(
                                                                                        "rounded-xl bg-gradient-to-r text-white font-black text-[9px] uppercase tracking-wider hover:opacity-95 h-8 px-3 transition-all flex items-center gap-1 active:scale-95 shadow-md shrink-0",
                                                                                        btnStyle,
                                                                                        effects
                                                                                    )}
                                                                                >
                                                                                    {label} <ArrowRight className="w-2.5 h-2.5" />
                                                                                </Button>
                                                                                <span className={cn("text-[8px] font-black uppercase tracking-wider mt-1 text-right block pr-1 select-none animate-pulse shrink-0", pointsColor)}>
                                                                                    Get {points} Points
                                                                                </span>
                                                                            </>
                                                                        );
                                                                    })()}
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
                                                                        <div 
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="text-xs font-black text-slate-600 bg-slate-100 border border-slate-200/80 rounded-xl px-3.5 py-1.5 focus:outline-none transition-all font-mono select-all cursor-default"
                                                                        >
                                                                            {item.metadata?.due_date 
                                                                                ? (() => {
                                                                                    const parts = item.metadata.due_date.split('-');
                                                                                    if (parts.length === 3) {
                                                                                        return `${parts[2]}-${parts[1]}-${parts[0]}`;
                                                                                    }
                                                                                    return format(new Date(item.metadata.due_date), 'dd-MM-yyyy');
                                                                                })()
                                                                                : "N/A"
                                                                            }
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* AutoPay and Days Left */}
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

            {/* Onboarding Dialog for Family Name */}
            <Dialog open={isFamilyModalOpen} onOpenChange={() => {}}>
                <DialogContent className="max-w-sm rounded-[32px] p-8 border-none shadow-2xl bg-white select-none pointer-events-auto" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-[#046A38]/10 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                            <Users className="w-8 h-8 text-[#046A38]" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Create Your PrePe Family</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-xs leading-relaxed mt-2 text-center">
                            Enter your family name to setup custom billing presets for Mobile, Electricity, Gas & Broadband.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="family_name_input" className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Family / House Name</Label>
                            <Input
                                id="family_name_input"
                                placeholder="e.g. Jeeva's, Sharma's, Sweet Home"
                                className="h-12 rounded-2xl border-slate-200 focus:border-[#046A38] focus:ring-4 focus:ring-[#046A38]/5 px-4 font-semibold text-slate-800"
                                value={familyInput}
                                onChange={(e) => setFamilyInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <DialogFooter className="pt-2">
                        <Button
                            onClick={handleSaveFamilyName}
                            disabled={loading || !familyInput.trim()}
                            className="w-full rounded-2xl bg-gradient-to-r from-[#046A38] to-green-700 text-white font-black hover:opacity-95 h-13 shadow-lg shadow-green-700/20 active:scale-98 transition-all uppercase tracking-widest text-xs"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Set Family & Auto Setup"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog for Family Name */}
            <Dialog open={isEditingFamilyName} onOpenChange={setIsEditingFamilyName}>
                <DialogContent className="max-w-sm rounded-[32px] p-8 border-none shadow-2xl bg-white select-none">
                    <DialogHeader className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-[#000080]/10 rounded-3xl flex items-center justify-center mb-4 shadow-inner">
                            <Settings className="w-8 h-8 text-[#000080]" />
                        </div>
                        <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">Edit PrePe Family Name</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-xs leading-relaxed mt-2 text-center">
                            Change your digital directory family branding name below.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit_family_name_input" className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Family / House Name</Label>
                            <Input
                                id="edit_family_name_input"
                                placeholder="e.g. Jeeva's, Sharma's, Sweet Home"
                                className="h-12 rounded-2xl border-slate-200 focus:border-[#000080] focus:ring-4 focus:ring-[#000080]/5 px-4 font-semibold text-slate-800"
                                value={familyInput}
                                onChange={(e) => setFamilyInput(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    <DialogFooter className="flex flex-row gap-3 pt-2 w-full">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsEditingFamilyName(false)}
                            className="flex-1 rounded-2xl font-bold text-slate-500 border-slate-200 hover:bg-slate-50 h-12"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleUpdateFamilyName}
                            disabled={!familyInput.trim()}
                            className="flex-1 rounded-2xl bg-[#000080] text-white font-black hover:bg-indigo-900 h-12 shadow-lg shadow-indigo-900/20 active:scale-98 transition-all uppercase tracking-widest text-xs"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Item Dialog */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl bg-white max-h-[90vh] overflow-y-auto no-scrollbar">
                    <DialogHeader className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                            <Edit2 className="w-8 h-8 text-blue-600 animate-pulse" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
                            {editingItem?.metadata?.is_preset ? "Edit Preset Card" : "Edit Directory Card"}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            {editingItem?.metadata?.is_preset 
                                ? "Presets can only have their mobile/account number and due date updated." 
                                : "Modify nickname, category, service type or details below."}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSaveEdit} className="space-y-5 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="edit_nickname" className="text-xs font-bold text-slate-500 ml-1 uppercase">Nickname / Relation</Label>
                            <Input 
                                id="edit_nickname"
                                placeholder="e.g. Dad's Phone, Home Electricity"
                                className="h-12 rounded-xl border-slate-200 focus:border-blue-500 px-4 disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100 font-semibold"
                                value={editFormData.title}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                                disabled={!!editingItem?.metadata?.is_preset}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit_service" className="text-xs font-bold text-slate-500 ml-1 uppercase">Service Type</Label>
                            <Select 
                                value={editFormData.service_type} 
                                onValueChange={(v) => setEditFormData(prev => ({ ...prev, service_type: v }))}
                                disabled={!!editingItem?.metadata?.is_preset}
                            >
                                <SelectTrigger className="h-12 rounded-xl border-slate-200 font-semibold disabled:bg-slate-50 disabled:text-slate-400 disabled:border-slate-100">
                                    <SelectValue placeholder="Select Service" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="MOBILE_PREPAID" className="rounded-lg py-2">Mobile Prepaid</SelectItem>
                                    <SelectItem value="MOBILE_POSTPAID" className="rounded-lg py-2">Mobile Postpaid</SelectItem>
                                    <SelectItem value="DTH" className="rounded-lg py-2">DTH Recharge</SelectItem>
                                    <SelectItem value="ELECTRICITY" className="rounded-lg py-2">Electricity Bill</SelectItem>
                                    <SelectItem value="GAS" className="rounded-lg py-2">Gas Piped/Cylinder</SelectItem>
                                    <SelectItem value="WATER" className="rounded-lg py-2">Water Bill</SelectItem>
                                    <SelectItem value="BROADBAND" className="rounded-lg py-2">Broadband/Landline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit_account" className="text-xs font-bold text-slate-500 ml-1 uppercase">Mobile / Account / Consumer ID</Label>
                            <Input 
                                id="edit_account"
                                placeholder="10-digit number or Consumer ID"
                                className="h-12 rounded-xl border-slate-200 focus:border-blue-500 px-4 font-semibold text-slate-800"
                                value={editFormData.account_id}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, account_id: e.target.value }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit_due_date" className="text-xs font-bold text-slate-500 ml-1 uppercase">Payment Due Date</Label>
                            <Input 
                                id="edit_due_date"
                                type="date"
                                className="h-12 rounded-xl border-slate-200 focus:border-blue-500 px-4 cursor-pointer font-semibold text-slate-800"
                                value={editFormData.due_date}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, due_date: e.target.value }))}
                            />
                        </div>

                        <DialogFooter className="pt-4 flex flex-row gap-3 w-full">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={() => setEditingItem(null)}
                                className="flex-1 rounded-xl font-bold text-slate-500 h-12"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="flex-1 rounded-xl bg-slate-900 text-white font-black hover:bg-blue-600 shadow-lg shadow-slate-900/10 h-12"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </Layout>
    );
};

export default SavedPage;
