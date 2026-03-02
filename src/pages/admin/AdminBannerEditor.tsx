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
    sort_order: number;
}

const EMPTY: BannerForm = {
    title: '', subtitle: '', tag: 'New Banner',
    cta_text: 'LEARN MORE', cta_link: '#',
    grad_from: '#065f46', grad_to: '#16a34a',
    icon_name: 'MessageCircle', status: 'draft', sort_order: 99,
};

// ── Live Preview ────────────────────────────────────────────────────────────────
const LivePreview = ({ form }: { form: BannerForm }) => {
    const Icon = ALL_ICONS[form.icon_name] || MessageCircle;
    return (
        <div
            className="relative overflow-hidden rounded-2xl text-white shadow-xl"
            style={{ background: `linear-gradient(135deg, ${form.grad_from}, ${form.grad_to})` }}
        >
            <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10 p-6 flex items-center gap-5">
                <div className="flex-1 min-w-0">
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/20 rounded-full px-3 py-1 mb-3">
                        {form.tag || 'Tag'}
                    </span>
                    <h3 className="text-xl font-extrabold leading-snug mb-2 whitespace-pre-line">
                        {form.title || 'Your Banner Title'}
                    </h3>
                    <p className="text-sm text-white/75 mb-4 line-clamp-2">
                        {form.subtitle || 'Subtitle goes here'}
                    </p>
                    <div className="inline-block bg-white/25 hover:bg-white/35 cursor-pointer rounded-full px-5 py-2 text-sm font-black transition-all">
                        {form.cta_text || 'Click Here'}
                    </div>
                </div>
                <div className="shrink-0 w-20 h-20 flex items-center justify-center">
                    <Icon className="w-16 h-16 opacity-80" />
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

    return (
        <div className="max-w-4xl mx-auto space-y-5 pb-10">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate('/admin/banners')}
                    className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {isNew ? '✨ New Banner' : '✏️ Edit Banner'}
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {isNew ? 'Design a new promotional banner for the home screen.' : `Editing banner · ${id?.slice(0, 8)}...`}
                    </p>
                </div>
                {/* Status pill */}
                <button
                    onClick={() => set('status', form.status === 'published' ? 'draft' : 'published')}
                    className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border transition-all',
                        form.status === 'published'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                    )}
                >
                    {form.status === 'published' ? <><Globe className="w-3.5 h-3.5" /> Published</> : <><Save className="w-3.5 h-3.5" /> Draft</>}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* ── Left column: form ── */}
                <div className="space-y-4">
                    {/* Content */}
                    <Section title="Content">
                        <Field label="Tag (small label above title)">
                            <Input className="rounded-xl h-10" placeholder="e.g. Community, Offer, New!" value={form.tag} onChange={e => set('tag', e.target.value)} />
                        </Field>
                        <Field label="Title *">
                            <Input className="rounded-xl h-10" placeholder="Main headline" value={form.title} onChange={e => set('title', e.target.value)} />
                        </Field>
                        <Field label="Subtitle">
                            <Input className="rounded-xl h-10" placeholder="Short supporting text" value={form.subtitle} onChange={e => set('subtitle', e.target.value)} />
                        </Field>
                    </Section>

                    {/* CTA */}
                    <Section title="Call to Action">
                        <Field label="Button Text">
                            <Input className="rounded-xl h-10" placeholder="e.g. JOIN NOW, RECHARGE" value={form.cta_text} onChange={e => set('cta_text', e.target.value)} />
                        </Field>
                        <Field label="Button Link">
                            <Input className="rounded-xl h-10" placeholder="https://... or #" value={form.cta_link} onChange={e => set('cta_link', e.target.value)} />
                        </Field>
                    </Section>

                    {/* Sort order */}
                    <Section title="Display Settings">
                        <Field label="Sort Order (lower = appears first)">
                            <Input
                                type="number" className="rounded-xl h-10 w-32"
                                value={form.sort_order}
                                onChange={e => set('sort_order', Number(e.target.value))}
                            />
                        </Field>
                    </Section>
                </div>

                {/* ── Right column: visual ── */}
                <div className="space-y-4">
                    {/* Live Preview */}
                    <Section title="Live Preview">
                        <LivePreview form={form} />
                    </Section>

                    {/* Gradient */}
                    <Section title="Gradient Colors">
                        <div className="grid grid-cols-6 gap-1.5 mb-3">
                            {PRESET_GRADIENTS.map(g => (
                                <button
                                    key={g.label}
                                    onClick={() => setForm(prev => ({ ...prev, grad_from: g.from, grad_to: g.to }))}
                                    title={g.label}
                                    className={cn(
                                        'h-9 rounded-xl border-2 text-white text-[8px] font-black transition-all',
                                        form.grad_from === g.from && form.grad_to === g.to
                                            ? 'border-white ring-2 ring-offset-1 ring-blue-500 scale-105'
                                            : 'border-transparent hover:scale-105'
                                    )}
                                    style={{ background: `linear-gradient(135deg, ${g.from}, ${g.to})` }}
                                >
                                    {g.label}
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'From', key: 'grad_from' as const },
                                { label: 'To', key: 'grad_to' as const },
                            ].map(({ label, key }) => (
                                <div key={key} className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 h-10">
                                    <input type="color" value={form[key]} onChange={e => set(key, e.target.value)}
                                        className="w-6 h-6 rounded cursor-pointer border-none bg-transparent shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 leading-none">{label}</p>
                                        <p className="text-xs font-mono text-slate-700">{form[key]}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                </div>
            </div>

            {/* Icon Picker — full width */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <IconPicker selected={form.icon_name} onSelect={name => set('icon_name', name)} />
            </div>

            {/* Save Buttons */}
            <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 sm:flex-none sm:px-8 rounded-xl font-bold border-slate-200 h-11"
                    onClick={() => navigate('/admin/banners')}>
                    Cancel
                </Button>
                <Button variant="outline" className="flex-1 sm:flex-none sm:px-8 rounded-xl font-bold h-11 border-slate-300"
                    onClick={() => save('draft')} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Draft
                </Button>
                <Button className="flex-1 sm:flex-none sm:px-8 rounded-xl font-black h-11 bg-blue-600 hover:bg-blue-700 text-white shadow"
                    onClick={() => save('published')} disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                    Publish
                </Button>
            </div>
        </div>
    );
};

export default AdminBannerEditor;
