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
    ArrowRight
} from 'lucide-react';
import { getSavedItems, removeSavedItem, type SavedItem } from '@/services/saved.service';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { AddCircleMemberDialog } from '@/components/saved/AddCircleMemberDialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const SavedPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

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
                    <div className="bg-white rounded-[32px] p-6 shadow-md border border-slate-100/50 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-[#000080]/5 to-transparent rounded-full pointer-events-none" />
                        
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FF671F] bg-[#FF671F]/10 px-3 py-1 rounded-full">
                                    Digital Directory
                                </span>
                                <h1 className="text-2xl font-black text-[#000080] tracking-tight mt-2">PrePe Circle</h1>
                                <p className="text-xs text-slate-500 font-medium mt-1">Your family, friends & saved payment links</p>
                            </div>
                            <Button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="rounded-2xl bg-gradient-to-r from-[#FF671F] to-orange-600 hover:opacity-95 text-white font-black h-12 px-5 shadow-lg shadow-orange-500/20 active:scale-95 transition-all uppercase tracking-widest text-[9px] shrink-0"
                            >
                                <Plus className="w-4 h-4 mr-1.5" /> Add New
                            </Button>
                        </div>

                        {/* High-visibility Search Input */}
                        <div className="relative mt-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by name, number, or category..."
                                className="pl-11 h-12 bg-slate-50 border-none rounded-2xl text-slate-800 placeholder-slate-400 text-sm font-semibold focus:ring-4 focus:ring-[#000080]/5 focus:bg-white transition-all shadow-inner"
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
                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                                                >
                                                    <Card className="overflow-hidden rounded-[28px] border-none shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#046A38]/10 transition-all bg-white relative">
                                                        <div className="p-5 flex items-center justify-between gap-4">
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
                                                                <Button
                                                                    onClick={() => handleAction(item)}
                                                                    className="rounded-2xl bg-gradient-to-r from-[#046A38] to-green-700 text-white font-black text-[10px] uppercase tracking-widest hover:opacity-95 shadow-md shadow-green-700/10 h-10 px-4 transition-all flex items-center gap-1 active:scale-95"
                                                                >
                                                                    Pay <Send className="w-3 h-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-100 bg-slate-50/50"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
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
                                        {favoriteItems.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                transition={{ duration: 0.3, delay: idx * 0.05 }}
                                            >
                                                <Card className="rounded-[28px] border-none shadow-sm hover:shadow-md hover:ring-2 hover:ring-[#FF671F]/10 transition-all bg-white relative">
                                                    <div className="p-5 flex items-center justify-between gap-4">
                                                        {/* High contrast Heart Icon Avatar */}
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-200 text-white flex items-center justify-center shrink-0">
                                                            <Heart className="w-6 h-6 fill-current text-white animate-pulse" />
                                                        </div>

                                                        {/* Favorite Title & Amount Info */}
                                                        <div className="flex-1 min-w-0 pr-1">
                                                            <h4 className="text-base font-black text-slate-900 truncate leading-snug" title={item.title}>
                                                                {item.title}
                                                            </h4>
                                                            
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="text-sm font-black text-[#046A38] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50">
                                                                    ₹{item.metadata?.amount || 'N/A'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                    {format(new Date(item.created_at), 'MMM d, yyyy')}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Mobile Actions */}
                                                        <div className="flex flex-col gap-2 shrink-0 items-end">
                                                            <Button
                                                                onClick={() => handleAction(item)}
                                                                className="rounded-2xl bg-gradient-to-r from-[#FF671F] to-orange-600 text-white font-black text-[10px] uppercase tracking-widest hover:opacity-95 shadow-md shadow-orange-700/10 h-10 px-4 transition-all flex items-center gap-1 active:scale-95"
                                                            >
                                                                Repeat <ArrowRight className="w-3.5 h-3.5" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(item.id)}
                                                                className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all border border-slate-100 bg-slate-50/50"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        ))}
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
        </Layout>
    );
};

export default SavedPage;
