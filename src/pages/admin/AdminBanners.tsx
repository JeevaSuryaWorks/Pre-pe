import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Banner Manager</h2>
                    <p className="text-slate-500 mt-1 font-medium">Create, edit and publish home-screen promotional banners in real time.</p>
                </div>
                <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl gap-2 shadow"
                    onClick={() => navigate('/admin/banners/new')}
                >
                    <Plus className="w-4 h-4" /> New Banner
                </Button>
            </div>



            {/* Banner List */}
            <div className="space-y-3">
                {isLoading ? (
                    [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />)
                ) : banners.length === 0 ? (
                    <Card className="p-16 text-center border-dashed border-2 border-slate-200 rounded-2xl">
                        <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                        <p className="font-bold text-slate-500">No banners yet. Create your first one!</p>
                    </Card>
                ) : (
                    banners.map((b, idx) => (
                        <Card key={b.id} className="border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row gap-0">
                                    {/* Mini preview strip */}
                                    <div className="w-full md:w-72 shrink-0">
                                        <div
                                            className="h-full min-h-[80px] relative overflow-hidden flex items-center px-4 py-3 text-white"
                                            style={{ background: `linear-gradient(to right, ${b.grad_from}, ${b.grad_to})` }}
                                        >
                                            {(() => { const Icon = ICON_MAP[b.icon_name] || MessageCircle; return <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 opacity-40" />; })()}
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-widest opacity-70">{b.tag}</p>
                                                <p className="text-sm font-extrabold leading-snug line-clamp-2">{b.title || '(No title)'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-3 p-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge className={cn('text-[10px] font-bold rounded-full border px-2',
                                                    b.status === 'published'
                                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                        : 'bg-amber-50 text-amber-700 border-amber-200'
                                                )}>
                                                    {b.status === 'published' ? '🌐 Published' : '📝 Draft'}
                                                </Badge>
                                                <Badge className={cn('text-[10px] font-bold rounded-full border px-2',
                                                    b.type === 'banner'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                                )}>
                                                    {b.type === 'banner' ? '💎 Banner' : '📣 Alert'}
                                                </Badge>
                                                {b.type === 'banner' && (
                                                    <Badge className={cn('text-[10px] font-bold rounded-full border px-2',
                                                        b.style === 'card'
                                                            ? 'bg-slate-50 text-slate-700 border-slate-200'
                                                            : 'bg-purple-50 text-purple-700 border-purple-200'
                                                    )}>
                                                        {b.style === 'card' ? '🃏 Classic' : '🎟️ Voucher'}
                                                    </Badge>
                                                )}
                                                {b.image_url && (
                                                    <Badge className="text-[10px] font-bold rounded-full border px-2 bg-pink-50 text-pink-700 border-pink-200">
                                                        🖼️ Image
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-slate-400">Order #{b.sort_order}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 truncate">{b.cta_link}</p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {/* Reorder */}
                                            <div className="flex gap-1">
                                                <button onClick={() => reorder(b, 'up')} disabled={idx === 0}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30">
                                                    <ArrowUp className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => reorder(b, 'down')} disabled={idx === banners.length - 1}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 disabled:opacity-30">
                                                    <ArrowDown className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Publish toggle */}
                                            <Button size="sm" variant="outline"
                                                className={cn('rounded-xl font-bold h-8 border gap-1',
                                                    b.status === 'published'
                                                        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                )}
                                                onClick={() => togglePublish(b)}
                                            >
                                                {b.status === 'published' ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                                            </Button>

                                            {/* Edit */}
                                            <Button size="sm" variant="outline"
                                                className="rounded-xl font-bold h-8 border-blue-200 text-blue-700 hover:bg-blue-50 gap-1"
                                                onClick={() => navigate(`/admin/banners/${b.id}`)}>
                                                <Edit3 className="w-3.5 h-3.5" /> Edit
                                            </Button>

                                            {/* Delete */}
                                            <Button size="sm" variant="outline"
                                                className="rounded-xl font-bold h-8 border-rose-200 text-rose-600 hover:bg-rose-50"
                                                onClick={() => { if (confirm('Delete this banner?')) deleteMutation.mutate(b.id); }}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

        </div>
    );
};

export default AdminBanners;
