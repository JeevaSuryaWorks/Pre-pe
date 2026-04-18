import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Plus, Trash2, Edit3, Eye, EyeOff, Save,
    ArrowUp, ArrowDown, Loader2, X, Globe, Search,
    MessageCircle, Zap, Gift, Shield, Megaphone, Star, Bell, Rocket, Heart, CheckCircle2,
    Wallet, CreditCard, Banknote, Coins, DollarSign, PiggyBank, TrendingUp, TrendingDown, BarChart2,
    Smartphone, Wifi, Tv, Radio, Monitor, Laptop, Tablet, Headphones, Speaker, Camera,
    ShoppingCart, ShoppingBag, Tag, Percent, BadgePercent, Ticket, Package, Box, Archive,
    Home, Building, MapPin, Navigation, Globe2, Map, Compass, Flag, Landmark,
    User, Users, UserCheck, UserPlus, Crown, Award, Trophy, Medal, Gem,
    Lock, Unlock, Key, Fingerprint, ShieldCheck, ShieldAlert,
    Mail, Phone, PhoneCall, MessageSquare, Send, Share2, Link, Rss,
    Calendar, Clock, Timer, AlarmClock, History, RefreshCw, RotateCcw,
    Settings, Sliders, ToggleLeft, Filter, SortAsc, LayoutGrid, List,
    Sun, Moon, Cloud, CloudRain, Snowflake, Wind, Thermometer, Umbrella,
    Music, Mic, Volume2, Play, Pause, SkipForward,
    Flame, Sparkles, Wand2, Lightbulb, Cpu, Code2, Terminal, Database,
    Truck, Car, Plane, Train, Bus, Bike, Fuel, MapPinned,
    Apple, Coffee, Pizza, ShoppingBasket, Utensils, Wine,
    Leaf, TreePine, Flower, Mountain, Waves, Droplets,
    BookOpen, GraduationCap, School, PenLine, FileText, ClipboardList,
    HeartPulse, Activity, Stethoscope, Pill,
    Wrench, Hammer, Paintbrush, Ruler, Scissors, Cog,
    Image, Video, Film, Layers, Layout, Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Banner {
    id: string;
    title: string;
    subtitle: string;
    tag: string;
    cta_text: string;
    cta_link: string;
    grad_from: string;
    grad_to: string;
    icon_name: string;
    status: 'draft' | 'published';
    type: 'banner' | 'announcement';
    style: 'card' | 'voucher';
    image_url?: string;
    sort_order: number;
    created_at: string;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    // Communication
    MessageCircle, MessageSquare, Mail, Phone, PhoneCall, Send, Share2, Link, Bell, Rss,
    // Finance
    Wallet, CreditCard, Banknote, Coins, DollarSign, PiggyBank, TrendingUp, TrendingDown, BarChart2,
    // Devices
    Smartphone, Wifi, Tv, Radio, Monitor, Laptop, Tablet, Headphones, Speaker, Camera, Cpu, Code2, Terminal, Database,
    // Shopping
    ShoppingCart, ShoppingBag, Tag, Percent, BadgePercent, Ticket, Package, Box, Archive, ShoppingBasket,
    // Places
    Home, Building, MapPin, Navigation, Globe2, Map, Compass, Flag, Landmark, MapPinned,
    // People & Rewards
    User, Users, UserCheck, UserPlus, Crown, Award, Trophy, Medal, Gem, GraduationCap, School,
    // Security
    Lock, Unlock, Key, Fingerprint, ShieldCheck, ShieldAlert, Shield, Eye,
    // Time
    Calendar, Clock, Timer, AlarmClock, History, RefreshCw, RotateCcw,
    // Settings & Tools
    Settings, Sliders, Filter, SortAsc, LayoutGrid, List, Cog, Wrench, Hammer, Ruler, Scissors, Paintbrush, ToggleLeft,
    // Weather & Nature
    Sun, Moon, Cloud, CloudRain, Snowflake, Wind, Thermometer, Umbrella, Leaf, TreePine, Flower, Mountain, Waves, Droplets,
    // Media
    Music, Mic, Volume2, Play, Pause, SkipForward, Film, Image, Video, Layers, Layout, Palette,
    // Energy & Action
    Zap, Flame, Sparkles, Wand2, Lightbulb, Rocket, Star, Heart,
    // Transport
    Truck, Car, Plane, Train, Bus, Bike, Fuel,
    // Food
    Coffee, Pizza, Utensils, Wine, Apple,
    // Health
    HeartPulse, Activity, Stethoscope, Pill,
    // Misc
    Megaphone, Gift, Globe, CheckCircle2, BookOpen, PenLine, FileText, ClipboardList,
};

// ── Icon Picker with Search ────────────────────────────────────────────────────
const ICON_ENTRIES = Object.entries(ICON_MAP);

const IconPicker = ({ selected, onSelect }: { selected: string; onSelect: (name: string) => void }) => {
    const [q, setQ] = useState('');
    const filtered = q.trim()
        ? ICON_ENTRIES.filter(([name]) => name.toLowerCase().includes(q.toLowerCase()))
        : ICON_ENTRIES;
    return (
        <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">
                Icon <span className="normal-case font-normal text-slate-400">({ICON_ENTRIES.length} icons)</span>
            </label>
            {/* Search */}
            <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search icons..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="w-full pl-8 pr-3 h-9 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {q && <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
            {/* Grid */}
            <div className="h-48 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2">
                {filtered.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">No icons found</p>
                ) : (
                    <div className="grid grid-cols-8 gap-1">
                        {filtered.map(([name, Icon]) => (
                            <button
                                key={name}
                                onClick={() => onSelect(name)}
                                title={name}
                                className={cn(
                                    'aspect-square flex items-center justify-center rounded-lg transition-all',
                                    selected === name
                                        ? 'bg-blue-600 text-white shadow-sm scale-110'
                                        : 'hover:bg-slate-200 text-slate-500'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            {/* Selected label */}
            {selected && (
                <p className="mt-1.5 text-[10px] text-slate-400 font-medium">Selected: <span className="text-blue-600 font-bold">{selected}</span></p>
            )}
        </div>
    );
};

const PRESET_GRADIENTS = [
    { label: 'Emerald', from: '#065f46', to: '#16a34a' },
    { label: 'Purple', from: '#4c1d95', to: '#7c3aed' },
    { label: 'Rose', from: '#881337', to: '#e11d48' },
    { label: 'Sky', from: '#0c4a6e', to: '#0284c7' },
    { label: 'Amber', from: '#78350f', to: '#d97706' },
    { label: 'Indigo', from: '#1e1b4b', to: '#4f46e5' },
    { label: 'Teal', from: '#134e4a', to: '#0d9488' },
    { label: 'Slate', from: '#1e293b', to: '#475569' },
];

// ── Mini Live Preview ──────────────────────────────────────────────────────────
const BannerPreview = ({ b }: { b: Partial<Banner> }) => {
    const Icon = ICON_MAP[b.icon_name || 'MessageCircle'] || MessageCircle;
    return (
        <div
            className="relative overflow-hidden rounded-xl text-white shadow-md"
            style={{ background: `linear-gradient(to right, ${b.grad_from || '#065f46'}, ${b.grad_to || '#16a34a'})` }}
        >
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full blur-2xl opacity-30 bg-white" />
            <div className="relative z-10 p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-white/20 rounded-full px-2 py-0.5 mb-1.5">
                        {b.tag || 'Tag'}
                    </span>
                    <p className="text-sm font-extrabold leading-snug whitespace-pre-line line-clamp-2">
                        {b.title || 'Banner Title'}
                    </p>
                    <p className="text-[10px] text-white/70 mt-0.5 line-clamp-1">{b.subtitle || 'Subtitle'}</p>
                    <div className="mt-2 inline-block bg-white/25 rounded-full px-3 py-1 text-[10px] font-black">
                        {b.cta_text || 'CTA'}
                    </div>
                </div>
                <Icon className="w-10 h-10 opacity-80 shrink-0" />
            </div>
        </div>
    );
};

// ── Empty banner template ──────────────────────────────────────────────────────
const newBanner = (): Omit<Banner, 'id' | 'created_at'> => ({
    title: '',
    subtitle: '',
    tag: 'New Banner',
    cta_text: 'LEARN MORE',
    cta_link: '#',
    grad_from: '#065f46',
    grad_to: '#16a34a',
    icon_name: 'MessageCircle',
    status: 'draft',
    type: 'banner',
    style: 'card',
    sort_order: 99,
});

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminBanners = () => {
    const qc = useQueryClient();
    const { toast } = useToast();
    const navigate = useNavigate();

    // ── Fetch
    const { data: banners = [], isLoading } = useQuery<Banner[]>({
        queryKey: ['admin_banners'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('banners')
                .select('*')
                .order('sort_order', { ascending: true });
            if (error) throw error;
            return data || [];
        },
    });

    // ── Realtime subscription to invalidate on DB change
    useEffect(() => {
        const channel = supabase
            .channel('banners_admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
                qc.invalidateQueries({ queryKey: ['admin_banners'] });
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [qc]);

    // ── Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any).from('banners').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admin_banners'] });
            toast({ title: '🗑️ Banner Deleted' });
        },
        onError: (e: any) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
    });

    // ── Toggle publish
    const togglePublish = async (b: Banner) => {
        const newStatus = b.status === 'published' ? 'draft' : 'published';
        const { error } = await (supabase as any).from('banners')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', b.id);
        if (error) {
            toast({ title: 'Failed to update status', description: error.message, variant: 'destructive' });
            return;
        }
        qc.invalidateQueries({ queryKey: ['admin_banners'] });
        toast({ title: newStatus === 'published' ? '🌐 Published!' : '📝 Moved to Draft' });
    };

    // ── Reorder
    const reorder = async (b: Banner, dir: 'up' | 'down') => {
        const idx = banners.findIndex(x => x.id === b.id);
        const swap = banners[dir === 'up' ? idx - 1 : idx + 1];
        if (!swap) return;
        const [r1, r2] = await Promise.all([
            (supabase as any).from('banners').update({ sort_order: swap.sort_order }).eq('id', b.id),
            (supabase as any).from('banners').update({ sort_order: b.sort_order }).eq('id', swap.id),
        ]);
        if (r1.error || r2.error) {
            toast({ title: 'Reorder failed', description: (r1.error || r2.error).message, variant: 'destructive' });
            return;
        }
        qc.invalidateQueries({ queryKey: ['admin_banners'] });
    };



    // ────────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-8 bg-blue-600 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Marketing Operations</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Banner Manager <Megaphone className="w-8 h-8 text-blue-600" />
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Industrial-grade control for promotional assets and global announcements.</p>
                </div>
                <Button
                    className="h-14 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl transition-all active:scale-95 group"
                    onClick={() => navigate('/admin/banners/new')}
                >
                    Initialize New Asset <Plus className="w-4 h-4 ml-2 group-hover:rotate-90 transition-transform" />
                </Button>
            </div>

            {/* Banner Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="h-48 rounded-[2rem] bg-slate-100 animate-pulse border-2 border-slate-50" />
                        ))
                    ) : banners.length === 0 ? (
                        <div className="col-span-full h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/50">
                            <Megaphone className="w-16 h-16 text-slate-200 mb-4" />
                            <p className="text-xl font-black text-slate-400 uppercase tracking-widest">No Active Assets</p>
                            <Button variant="ghost" className="mt-4 font-bold text-blue-600" onClick={() => navigate('/admin/banners/new')}>
                                Create First Banner
                            </Button>
                        </div>
                    ) : (
                        banners.map((b, idx) => {
                            const Icon = ICON_MAP[b.icon_name] || MessageCircle;
                            return (
                                <motion.div
                                    key={b.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative"
                                >
                                    <Card className="h-full border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem] transition-all duration-500 hover:shadow-blue-500/10 hover:-translate-y-1">
                                        <CardContent className="p-0 flex flex-col h-full">
                                            {/* Visual Strip */}
                                            <div 
                                                className="h-32 relative overflow-hidden flex items-end p-6 text-white"
                                                style={{ background: `linear-gradient(135deg, ${b.grad_from}, ${b.grad_to})` }}
                                            >
                                                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                                                    <Icon className="w-32 h-32" />
                                                </div>
                                                <div className="relative z-10 w-full flex justify-between items-end">
                                                    <div>
                                                        <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-none text-[9px] font-black uppercase tracking-widest px-3 py-1 mb-2">
                                                            {b.tag || 'PROMO'}
                                                        </Badge>
                                                        <h3 className="text-xl font-black leading-tight tracking-tight line-clamp-2">
                                                            {b.title || 'Untitled Banner'}
                                                        </h3>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Info & Actions */}
                                            <div className="p-6 flex flex-col flex-1 bg-white">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Badge className={cn(
                                                        "rounded-full px-4 py-1 border-none font-black text-[9px] uppercase tracking-widest",
                                                        b.status === 'published' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                    )}>
                                                        {b.status === 'published' ? '● Operation Live' : '○ System Draft'}
                                                    </Badge>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
                                                        Priority #{b.sort_order}
                                                    </span>
                                                </div>

                                                <p className="text-xs font-medium text-slate-500 mb-6 line-clamp-2">
                                                    {b.subtitle || 'No detailed description provided for this operational asset.'}
                                                </p>

                                                {/* Control Panel */}
                                                <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between gap-2">
                                                    <div className="flex gap-1">
                                                        <Button 
                                                            variant="ghost" size="icon" 
                                                            className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-20"
                                                            onClick={() => reorder(b, 'up')}
                                                            disabled={idx === 0}
                                                        >
                                                            <ArrowUp className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" size="icon" 
                                                            className="h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-400 disabled:opacity-20"
                                                            onClick={() => reorder(b, 'down')}
                                                            disabled={idx === banners.length - 1}
                                                        >
                                                            <ArrowDown className="w-4 h-4" />
                                                        </Button>
                                                    </div>

                                                    <div className="flex gap-2">
                                                        <Button 
                                                            variant="ghost" size="icon" 
                                                            className={cn(
                                                                "h-9 w-9 rounded-xl transition-colors",
                                                                b.status === 'published' ? "hover:bg-amber-50 text-amber-600" : "hover:bg-emerald-50 text-emerald-600"
                                                            )}
                                                            onClick={() => togglePublish(b)}
                                                        >
                                                            {b.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" size="icon" 
                                                            className="h-9 w-9 rounded-xl hover:bg-blue-50 text-blue-600"
                                                            onClick={() => navigate(`/admin/banners/${b.id}`)}
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" size="icon" 
                                                            className="h-9 w-9 rounded-xl hover:bg-rose-50 text-rose-600"
                                                            onClick={() => { if (confirm('Purge this asset from the registry?')) deleteMutation.mutate(b.id); }}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminBanners;
