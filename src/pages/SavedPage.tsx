import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    ChevronRight,
    Search,
    Loader2,
    History,
    MoreVertical,
    Trash2,
    Zap
} from 'lucide-react';
import { getSavedItems, removeSavedItem, type SavedItem } from '@/services/saved.service';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { AddCircleMemberDialog } from '@/components/saved/AddCircleMemberDialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const SavedPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

    const loadData = async () => {
        if (user) {
            setLoading(true);
            const items = await getSavedItems(user.id);
            setSavedItems(items);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [user]);

    const handleDelete = async (id: string) => {
        const success = await removeSavedItem(id);
        if (success) {
            setSavedItems(prev => prev.filter(item => item.id !== id));
            toast({ title: "Deleted", description: "Item removed successfully." });
        }
    };

    const getServiceIcon = (serviceType: string) => {
        switch (serviceType) {
            case 'MOBILE_PREPAID':
            case 'MOBILE_POSTPAID':
                return <Smartphone className="h-5 w-5" />;
            case 'DTH':
                return <Tv className="h-5 w-5" />;
            case 'ELECTRICITY':
                return <Lightbulb className="h-5 w-5" />;
            case 'GAS':
                return <Flame className="h-5 w-5" />;
            case 'WATER':
                return <Droplet className="h-5 w-5" />;
            case 'BROADBAND':
                return <Wifi className="h-5 w-5" />;
            default:
                return <Zap className="h-5 w-5" />;
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

    const circleItems = savedItems.filter(i => i.category === 'CIRCLE');
    const favoriteItems = savedItems.filter(i => i.category === 'FAVORITE');

    return (
        <Layout title="Saved" showBottomNav>
            <div className="container max-w-2xl px-4 py-8 pb-24 space-y-6">
                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Saved</h1>
                        <p className="text-slate-500 font-medium">Your circle & favorites</p>
                    </div>
                    <Button 
                        onClick={() => setIsAddDialogOpen(true)}
                        className="rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold h-12 px-6 shadow-lg shadow-slate-900/10 transition-all duration-300"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Add Member
                    </Button>
                </header>

                <Tabs defaultValue="circle" className="w-full">
                    <TabsList className="w-full grid grid-cols-2 p-1 bg-slate-100/50 rounded-2xl mb-8 h-12">
                        <TabsTrigger value="circle" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                           <Users className="w-4 h-4 mr-2" /> Circle
                        </TabsTrigger>
                        <TabsTrigger value="favorites" className="rounded-xl font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
                           <Heart className="w-4 h-4 mr-2" /> Favorites
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="circle" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
                        ) : circleItems.length === 0 ? (
                            <div className="text-center py-16 px-8 rounded-[40px] border-4 border-dashed border-slate-100 bg-slate-50/50">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Users className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Build Your Circle</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mb-8">Add family members to quickly manage their recharges and bills in one place.</p>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(true)} className="rounded-2xl border-2 border-slate-200 font-bold px-8">
                                    Add First Member
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {circleItems.map((item) => (
                                    <Card key={item.id} className="group relative overflow-hidden rounded-[32px] border-none shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 bg-white border border-slate-100">
                                        <div className="p-6 flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                {getServiceIcon(item.service_type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-lg font-black text-slate-900 truncate">{item.title}</h4>
                                                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-slate-50 text-slate-400 border-none font-black">
                                                        {item.service_type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-mono font-bold text-slate-500 mt-1">{item.account_id}</p>
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                <Button 
                                                    onClick={() => handleAction(item)}
                                                    className="rounded-2xl bg-slate-900 text-white font-black text-xs hover:bg-blue-600 h-10 px-4 transition-all"
                                                >
                                                    Pay Now
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleDelete(item.id)}
                                                    className="absolute top-4 right-4 h-8 w-8 rounded-xl text-slate-200 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="favorites" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>
                        ) : favoriteItems.length === 0 ? (
                            <div className="text-center py-16 px-8 rounded-[40px] border-4 border-dashed border-slate-100 bg-slate-50/50">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                    <Heart className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">No Favorites Yet</h3>
                                <p className="text-slate-500 max-w-xs mx-auto mb-8">Save your successful transactions from history to see them here for quick re-execution.</p>
                                <Button variant="outline" onClick={() => navigate('/transactions')} className="rounded-2xl border-2 border-slate-200 font-bold px-8">
                                    View History
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {favoriteItems.map((item) => (
                                    <div 
                                        key={item.id} 
                                        className="flex items-center justify-between p-5 rounded-[28px] border border-slate-100 bg-white hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                                                <Heart className="w-6 h-6 fill-current" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900">{item.title}</h4>
                                                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                                                    <span>₹{item.metadata?.amount || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                onClick={() => handleAction(item)}
                                                className="rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 h-9"
                                            >
                                                Repeat
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleDelete(item.id)}
                                                className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
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
