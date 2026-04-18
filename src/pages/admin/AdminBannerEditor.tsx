import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
    ArrowLeft, Save, Globe, Loader2, Search, X,
    MessageCircle, Zap, Gift, Shield, Megaphone, Star, Bell, Rocket, Heart, CheckCircle2,
    Wallet, CreditCard, Banknote, Coins, DollarSign, PiggyBank, TrendingUp, TrendingDown, BarChart2,
    Smartphone, Wifi, Tv, Radio, Monitor, Laptop, Tablet, Headphones, Speaker, Camera, Cpu, Code2, Terminal, Database,
    ShoppingCart, ShoppingBag, Tag, Percent, BadgePercent, Ticket, Package, Box, Archive, ShoppingBasket,
    Home, Building, MapPin, Navigation, Globe2, Map, Compass, Flag, Landmark, MapPinned,
    User, Users, UserCheck, UserPlus, Crown, Award, Trophy, Medal, Gem, GraduationCap, School,
    Lock, Unlock, Key, Fingerprint, ShieldCheck, ShieldAlert, Eye,
    Mail, Phone, PhoneCall, MessageSquare, Send, Share2, Link, Rss,
    Calendar, Clock, Timer, AlarmClock, History, RefreshCw, RotateCcw,
    Settings, Sliders, ToggleLeft, Filter, SortAsc, LayoutGrid, List,
    Sun, Moon, Cloud, CloudRain, Snowflake, Wind, Thermometer, Umbrella,
    Music, Mic, Volume2, Play, Pause, SkipForward,
    Flame, Sparkles, Wand2, Lightbulb,
    Truck, Car, Plane, Train, Bus, Bike, Fuel,
    Coffee, Pizza, Utensils, Wine, Apple,
    Leaf, TreePine, Flower, Mountain, Waves, Droplets,
    BookOpen, PenLine, FileText, ClipboardList,
    HeartPulse, Activity, Stethoscope, Pill,
    Wrench, Hammer, Paintbrush, Ruler, Scissors, Cog,
    Image, Video, Film, Layers, Layout, Palette,
} from 'lucide-react';

// ── Icon Categories ─────────────────────────────────────────────────────────────
const ICON_CATEGORIES: Record<string, Record<string, React.ComponentType<any>>> = {
    'Communication': { MessageCircle, MessageSquare, Mail, Phone, PhoneCall, Send, Share2, Link, Bell, Rss },
    'Finance': { Wallet, CreditCard, Banknote, Coins, DollarSign, PiggyBank, TrendingUp, TrendingDown, BarChart2 },
    'Devices': { Smartphone, Wifi, Tv, Radio, Monitor, Laptop, Tablet, Headphones, Speaker, Camera, Cpu, Code2, Terminal, Database },
    'Shopping': { ShoppingCart, ShoppingBag, Tag, Percent, BadgePercent, Ticket, Package, Box, Archive, ShoppingBasket },
    'Places': { Home, Building, MapPin, Navigation, Globe2, Map, Compass, Flag, Landmark, MapPinned },
    'People': { User, Users, UserCheck, UserPlus, Crown, Award, Trophy, Medal, Gem, GraduationCap, School },
    'Security': { Lock, Unlock, Key, Fingerprint, ShieldCheck, ShieldAlert, Shield, Eye },
    'Time': { Calendar, Clock, Timer, AlarmClock, History, RefreshCw, RotateCcw },
    'Tools': { Settings, Sliders, Filter, SortAsc, LayoutGrid, List, Cog, Wrench, Hammer, Ruler, Scissors, Paintbrush, ToggleLeft },
    'Weather': { Sun, Moon, Cloud, CloudRain, Snowflake, Wind, Thermometer, Umbrella, Leaf, TreePine, Flower, Mountain, Waves, Droplets },
    'Media': { Music, Mic, Volume2, Play, Pause, SkipForward, Film, Image, Video, Layers, Layout, Palette },
    'Energy': { Zap, Flame, Sparkles, Wand2, Lightbulb, Rocket, Star, Heart },
    'Transport': { Truck, Car, Plane, Train, Bus, Bike, Fuel },
    'Health': { HeartPulse, Activity, Stethoscope, Pill },
    'Misc': { Megaphone, Gift, Globe, CheckCircle2, BookOpen, PenLine, FileText, ClipboardList },
};

const ALL_ICONS: Record<string, React.ComponentType<any>> = Object.values(ICON_CATEGORIES).reduce(
    (acc, cat) => ({ ...acc, ...cat }), {}
);

const PRESET_GRADIENTS = [
    { label: 'Emerald', from: '#065f46', to: '#16a34a' },
    { label: 'Purple', from: '#4c1d95', to: '#7c3aed' },
    { label: 'Rose', from: '#881337', to: '#e11d48' },
    { label: 'Sky', from: '#0c4a6e', to: '#0284c7' },
    { label: 'Amber', from: '#78350f', to: '#d97706' },
    { label: 'Indigo', from: '#1e1b4b', to: '#4f46e5' },
    { label: 'Teal', from: '#134e4a', to: '#0d9488' },
    { label: 'Slate', from: '#1e293b', to: '#475569' },
    { label: 'Fuchsia', from: '#701a75', to: '#c026d3' },
    { label: 'Orange', from: '#7c2d12', to: '#ea580c' },
    { label: 'Lime', from: '#1a2e05', to: '#65a30d' },
    { label: 'Cyan', from: '#083344', to: '#0891b2' },
];

interface BannerForm {
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
}

const EMPTY: BannerForm = {
    title: '', subtitle: '', tag: 'New Banner',
    cta_text: 'LEARN MORE', cta_link: '#',
    grad_from: '#065f46', grad_to: '#16a34a',
    icon_name: 'MessageCircle', status: 'draft', 
    type: 'banner', style: 'card', sort_order: 99,
};

// ── Live Preview ────────────────────────────────────────────────────────────────
const LivePreview = ({ form }: { form: BannerForm }) => {
    const Icon = ALL_ICONS[form.icon_name] || MessageCircle;
    const isVoucher = form.style === 'voucher';

    if (isVoucher) {
        return (
            <div className="relative group px-1 py-1">
                <div className="flex bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100" style={{ borderLeft: `4px solid ${form.grad_from}` }}>
                    {/* Left Section */}
                    <div className="flex-1 p-5 relative min-h-[110px] flex flex-col justify-center">
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                            {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: form.grad_from }} />)}
                        </div>
                        <div className="flex items-center gap-2.5 mb-2">
                            {form.image_url ? (
                                <img src={form.image_url} alt="logo" className="w-7 h-7 object-contain" />
                            ) : (
                                <Icon className="w-6 h-6" style={{ color: form.grad_from }} />
                            )}
                            <span className="text-sm font-black text-slate-800 tracking-tight">{form.title || 'Brand Name'}</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100 self-start">
                            {form.tag || 'Voucher'}
                        </span>
                    </div>

                    {/* Separator */}
                    <div className="relative w-px border-r border-dashed my-3 opacity-30" style={{ borderColor: form.grad_from }}>
                        <div className="absolute -top-4 -left-1.5 w-3 h-3 rounded-full" style={{ backgroundColor: form.grad_from }} />
                        <div className="absolute -bottom-4 -left-1.5 w-3 h-3 rounded-full" style={{ backgroundColor: form.grad_from }} />
                    </div>

                    {/* Right Section */}
                    <div className="w-28 p-3 flex items-center justify-center relative">
                        <div className="w-full h-full rounded-xl flex flex-col items-center justify-center p-2" style={{ backgroundColor: `${form.grad_from}10`, border: `1px dashed ${form.grad_from}40` }}>
                            <span className="text-[9px] font-black uppercase mb-0.5" style={{ color: form.grad_from }}>REDEEM</span>
                            <span className="text-sm font-black leading-tight text-center px-1" style={{ color: form.grad_from }}>{form.cta_text || 'OFF'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative overflow-hidden rounded-2xl text-white shadow-xl h-44"
            style={{ background: `linear-gradient(135deg, ${form.grad_from}, ${form.grad_to})` }}
        >
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 p-6 flex items-center gap-5 h-full">
                <div className="flex-1 min-w-0">
                    <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] bg-white/30 backdrop-blur-md border border-white/20 text-white rounded-full px-3 py-1 mb-3">
                        {form.tag || 'Tag'}
                    </span>
                    <h3 className="text-xl font-black text-white leading-tight mb-2 whitespace-pre-line tracking-tight">
                        {form.title || 'Your Banner Title'}
                    </h3>
                    <p className="text-[11px] font-medium text-emerald-50/70 mb-4 line-clamp-2 leading-relaxed">
                        {form.subtitle || 'Subtitle goes here'}
                    </p>
                    <div className="inline-block bg-white text-emerald-900 rounded-xl px-5 py-2.5 text-[11px] font-black shadow-lg uppercase tracking-widest">
                        {form.cta_text || 'Click Here'}
                    </div>
                </div>
                <div className="shrink-0 w-24 h-24 flex items-center justify-center">
                    {form.image_url ? (
                        <img src={form.image_url} alt="preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
                    ) : (
                        <Icon className="w-16 h-16 opacity-80" />
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Icon Picker ─────────────────────────────────────────────────────────────────
const IconPicker = ({ selected, onSelect }: { selected: string; onSelect: (n: string) => void }) => {
    const [q, setQ] = useState('');
    const [activeTab, setActiveTab] = useState('All');
    const categories = ['All', ...Object.keys(ICON_CATEGORIES)];
    const sourceMap = activeTab === 'All' ? ALL_ICONS : ICON_CATEGORIES[activeTab] || ALL_ICONS;
    const entries = Object.entries(sourceMap).filter(([name]) =>
        !q.trim() || name.toLowerCase().includes(q.toLowerCase())
    );

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-700">
                    Icon
                    <span className="ml-1.5 text-xs font-normal text-slate-400">
                        ({Object.keys(ALL_ICONS).length} total)
                    </span>
                </label>
                {selected && (
                    <span className="text-xs text-blue-600 font-bold bg-blue-50 rounded-full px-2 py-0.5">{selected}</span>
                )}
            </div>

            {/* Category Tabs — scrollable row */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveTab(cat)}
                        className={cn(
                            'shrink-0 text-[10px] font-black uppercase tracking-wide px-3 py-1.5 rounded-full border transition-all',
                            activeTab === cat
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-blue-600'
                        )}
                    >
                        {cat}
                        {cat !== 'All' && (
                            <span className="ml-1 opacity-60">
                                {Object.keys(ICON_CATEGORIES[cat] || {}).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder={`Search ${activeTab === 'All' ? 'all icons' : activeTab + ' icons'}...`}
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="w-full pl-9 pr-8 h-9 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
                {q && (
                    <button onClick={() => setQ('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            {/* Icon Grid */}
            <div className="h-56 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-2">
                {entries.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">No icons match "{q}"</p>
                ) : (
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1">
                        {entries.map(([name, Icon]) => (
                            <button
                                key={name}
                                onClick={() => onSelect(name)}
                                title={name}
                                className={cn(
                                    'aspect-square flex items-center justify-center rounded-xl transition-all duration-100',
                                    selected === name
                                        ? 'bg-blue-600 text-white shadow-md scale-110 ring-2 ring-blue-400 ring-offset-1'
                                        : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <p className="text-[10px] text-slate-400">
                Showing {entries.length} icon{entries.length !== 1 ? 's' : ''}
                {q && ` for "${q}"`}
                {activeTab !== 'All' && ` in ${activeTab}`}
            </p>
        </div>
    );
};

// ── Section wrapper ─────────────────────────────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h3>
        {children}
    </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
        <label className="text-sm font-semibold text-slate-700 block">{label}</label>
        {children}
    </div>
);

// ── Main Editor Page ────────────────────────────────────────────────────────────
const AdminBannerEditor = () => {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const isNew = !id;

    const [form, setForm] = useState<BannerForm>(EMPTY);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!isNew);

    const set = (key: keyof BannerForm, val: any) => setForm(prev => ({ ...prev, [key]: val }));

    // Load existing banner for edit
    useEffect(() => {
        if (!id) return;
        (async () => {
            setFetching(true);
            const { data, error } = await (supabase as any).from('banners').select('*').eq('id', id).single();
            if (error) { toast({ title: 'Banner not found', variant: 'destructive' }); navigate('/admin/banners'); return; }
            const { created_at, ...rest } = data;
            setForm(rest as BannerForm);
            setFetching(false);
        })();
    }, [id]);

    // Auto-save draft to localStorage
    useEffect(() => {
        if (!fetching) localStorage.setItem('banner_editor_draft', JSON.stringify({ id, form }));
    }, [form, fetching]);

    const save = async (status: 'draft' | 'published') => {
        if (!form.title.trim()) { toast({ title: 'Title is required', variant: 'destructive' }); return; }
        setLoading(true);
        const payload = { ...form, status, updated_at: new Date().toISOString() };
        let error;
        if (isNew) {
            ({ error } = await (supabase as any).from('banners').insert(payload));
        } else {
            ({ error } = await (supabase as any).from('banners').update(payload).eq('id', id));
        }
        setLoading(false);
        if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
        localStorage.removeItem('banner_editor_draft');
        toast({ title: status === 'published' ? '🌐 Published!' : '📝 Saved as Draft' });
        navigate('/admin/banners');
    };

    if (fetching) return (
        <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    // ────────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-10">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <button 
                    onClick={() => navigate('/admin/banners')}
                    className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Marketing / Banner Registry</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        {isNew ? 'Initialize Asset' : 'Refine Operational Asset'} 
                        <span className="text-blue-600">[{id?.slice(0, 4) || 'NEW'}]</span>
                    </h1>
                </div>
                {/* Secondary Actions */}
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => navigate('/admin/banners')}
                        className="h-11 px-6 rounded-xl font-bold border-slate-200"
                    >
                        Abort
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* ── Left column: Command Console (Form) ── */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Primary Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Section title="Asset Type Identification">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'banner' as const, label: 'Standard Banner', icon: LayoutGrid },
                                    { id: 'announcement' as const, label: 'Global Alert', icon: Megaphone },
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => set('type', t.id)}
                                        className={cn(
                                            'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all group',
                                            form.type === t.id
                                                ? 'bg-blue-600 border-blue-600 translate-y-[-2px] shadow-lg shadow-blue-500/20'
                                                : 'bg-white border-slate-100 hover:border-slate-200'
                                        )}
                                    >
                                        <t.icon className={cn('w-5 h-5 transition-transform duration-300 group-hover:scale-110', form.type === t.id ? 'text-white' : 'text-slate-400')} />
                                        <span className={cn('text-[10px] font-black uppercase tracking-tight', form.type === t.id ? 'text-white' : 'text-slate-500')}>
                                            {t.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </Section>

                        <Section title="Visual Architecture">
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'card' as const, label: 'Industrial Classic', icon: Layout },
                                    { id: 'voucher' as const, label: 'Dynamic Voucher', icon: Ticket },
                                ].map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => set('style', s.id)}
                                        className={cn(
                                            'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all group',
                                            form.style === s.id
                                                ? 'bg-blue-900 border-blue-900 translate-y-[-2px] shadow-lg shadow-blue-900/20'
                                                : 'bg-white border-slate-100 hover:border-slate-200'
                                        )}
                                    >
                                        <s.icon className={cn('w-5 h-5 transition-transform duration-300 group-hover:scale-110', form.style === s.id ? 'text-white' : 'text-slate-400')} />
                                        <span className={cn('text-[10px] font-black uppercase tracking-tight', form.style === s.id ? 'text-white' : 'text-slate-500')}>
                                            {s.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </Section>
                    </div>

                    {/* Content Registry */}
                    <Section title="Content Specification">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <Field label="Asset Identity (Tag)">
                                    <Input 
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-bold" 
                                        placeholder="e.g. SYSTEM_UPDATE" 
                                        value={form.tag} 
                                        onChange={e => set('tag', e.target.value)} 
                                    />
                                </Field>
                                <Field label="Primary Headline *">
                                    <Input 
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-black text-lg" 
                                        placeholder="Enter high-impact title" 
                                        value={form.title} 
                                        onChange={e => set('title', e.target.value)} 
                                    />
                                </Field>
                            </div>
                            <div className="space-y-4">
                                <Field label="Supporting Detail (Subtitle)">
                                    <Input 
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-medium" 
                                        placeholder="Enter technical or marketing copy" 
                                        value={form.subtitle} 
                                        onChange={e => set('subtitle', e.target.value)} 
                                    />
                                </Field>
                                <Field label="Priority Index (Sort Order)">
                                    <Input 
                                        type="number"
                                        className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-black" 
                                        value={form.sort_order} 
                                        onChange={e => set('sort_order', Number(e.target.value))} 
                                    />
                                </Field>
                            </div>
                        </div>
                    </Section>

                    {/* Interaction Protocol */}
                    <Section title="Interaction Protocol (CTA)">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Field label="Command Label (Button Text)">
                                <Input 
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-black uppercase tracking-widest text-xs" 
                                    placeholder="e.g. EXECUTE_UPGRADE" 
                                    value={form.cta_text} 
                                    onChange={e => set('cta_text', e.target.value)} 
                                />
                            </Field>
                            <Field label="Destination URI (Link)">
                                <Input 
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white transition-all font-mono text-xs" 
                                    placeholder="https://..." 
                                    value={form.cta_link} 
                                    onChange={e => set('cta_link', e.target.value)} 
                                />
                            </Field>
                        </div>
                    </Section>

                    {/* Icon Selection Module */}
                    <Section title="Symbolic Identifier (Icon)">
                        <IconPicker selected={form.icon_name} onSelect={name => set('icon_name', name)} />
                    </Section>
                </div>

                {/* ── Right column: Visual Monitor & Commit Engine ── */}
                <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
                    {/* Live Telemetry (Preview) */}
                    <Section title="Real-Time Visual Telemetry">
                        <div className="p-2 bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden border-4 border-slate-800">
                             <LivePreview form={form} />
                        </div>
                        <div className="flex items-center gap-2 mt-4 px-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rendering Local Buffer</span>
                        </div>
                    </Section>

                    {/* Gradient Core */}
                    <Section title="Chroma Engine (Gradients)">
                        <div className="grid grid-cols-4 gap-2">
                            {PRESET_GRADIENTS.map(g => (
                                <button
                                    key={g.label}
                                    onClick={() => setForm(prev => ({ ...prev, grad_from: g.from, grad_to: g.to }))}
                                    className={cn(
                                        'h-10 rounded-xl transition-all duration-300 border-2',
                                        form.grad_from === g.from ? 'border-blue-600 scale-105 shadow-lg' : 'border-transparent opacity-80 hover:opacity-100'
                                    )}
                                    style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                                />
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50">
                                <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Vector From</span>
                                <input type="color" value={form.grad_from} onChange={e => set('grad_from', e.target.value)} className="w-full h-8 cursor-pointer bg-transparent border-none" />
                            </div>
                            <div className="flex flex-col border border-slate-100 rounded-xl p-3 bg-slate-50">
                                <span className="text-[9px] font-black uppercase text-slate-400 mb-1">Vector To</span>
                                <input type="color" value={form.grad_to} onChange={e => set('grad_to', e.target.value)} className="w-full h-8 cursor-pointer bg-transparent border-none" />
                            </div>
                        </div>
                    </Section>

                    {/* Commit Actions */}
                    <div className="flex flex-col gap-3">
                        <Button 
                            className="h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl group"
                            onClick={() => save('draft')}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2 group-hover:-translate-y-0.5 transition-transform" />}
                            Store Draft Records
                        </Button>
                        <Button 
                            className="h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-blue-500/20 group"
                            onClick={() => save('published')}
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />}
                            Commit to Production
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminBannerEditor;
