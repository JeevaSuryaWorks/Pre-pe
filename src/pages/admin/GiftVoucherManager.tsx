import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Gift, Plus, Trash2, Tag, Percent, Banknote, Sparkles, AlertCircle, ShoppingBag, Eye 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface GiftVoucher {
    id: string;
    name: string;
    provider: string;
    amount: number;
    price: number;
    discount: number;
    code: string;
    bannerUrl: string;
    description: string;
    destinationUrl?: string;
    created_at: string;
}

const PROVIDERS = [
    { name: 'Amazon Pay', color: 'from-[#FF9900]/20 to-[#FF9900]/5', border: 'border-orange-500/20', text: 'text-orange-500', bg: '#FF9900' },
    { name: 'Google Play', color: 'from-[#4285F4]/20 to-[#34A853]/5', border: 'border-blue-500/20', text: 'text-blue-500', bg: '#4285F4' },
    { name: 'Netflix', color: 'from-[#E50914]/20 to-[#E50914]/5', border: 'border-rose-600/20', text: 'text-rose-600', bg: '#E50914' },
    { name: 'Apple iTunes', color: 'from-[#000000]/20 to-[#000000]/5', border: 'border-slate-800/20', text: 'text-slate-800', bg: '#000000' },
    { name: 'Myntra', color: 'from-[#FF3F6C]/20 to-[#FF3F6C]/5', border: 'border-pink-500/20', text: 'text-pink-500', bg: '#FF3F6C' },
    { name: 'Swiggy', color: 'from-[#FC8019]/20 to-[#FC8019]/5', border: 'border-orange-600/20', text: 'text-orange-600', bg: '#FC8019' },
    { name: 'Zomato', color: 'from-[#CB202D]/20 to-[#CB202D]/5', border: 'border-rose-500/20', text: 'text-rose-500', bg: '#CB202D' },
    { name: 'Steam Wallet', color: 'from-[#171a21]/20 to-[#171a21]/5', border: 'border-blue-900/20', text: 'text-blue-900', bg: '#171a21' },
    { name: 'Custom Generic', color: 'from-blue-600/10 to-indigo-600/5', border: 'border-blue-500/10', text: 'text-blue-600', bg: '#2563eb' }
];

export default function GiftVoucherManager() {
    const [vouchers, setVouchers] = useState<GiftVoucher[]>([]);
    const [loading, setLoading] = useState(true);

    // Form state
    const [name, setName] = useState('');
    const [provider, setProvider] = useState('Amazon Pay');
    const [amount, setAmount] = useState('');
    const [discount, setDiscount] = useState('');
    const [code, setCode] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [description, setDescription] = useState('');
    const [destinationUrl, setDestinationUrl] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadVouchers();
    }, []);

    const loadVouchers = async () => {
        try {
            // Attempt to load from Supabase database table
            const { data, error } = await supabase
                .from('gift_vouchers' as any)
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                setVouchers(data as any);
            } else {
                // Fallback to localStorage if table doesn't exist
                const local = localStorage.getItem('prepe_gift_vouchers');
                if (local) {
                    setVouchers(JSON.parse(local));
                } else {
                    // Populate default high-fidelity fallbacks
                    const defaults: GiftVoucher[] = [
                        {
                            id: 'v1',
                            name: 'Amazon Prime Shopping Voucher',
                            provider: 'Amazon Pay',
                            amount: 500,
                            price: 475,
                            discount: 5,
                            code: 'AMZPRIME500',
                            bannerUrl: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=600',
                            description: 'Get flat 5% instant cashback on Amazon Pay shopping voucher. Safe, instant, redeemable worldwide.',
                            created_at: new Date().toISOString()
                        },
                        {
                            id: 'v2',
                            name: 'Google Play Gift Card',
                            provider: 'Google Play',
                            amount: 250,
                            price: 240,
                            discount: 4,
                            code: 'GPLAY250',
                            bannerUrl: 'https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=600',
                            description: 'Google Play instant prepaid code. Claim game items, books, movies and custom skins instantly.',
                            created_at: new Date().toISOString()
                        }
                    ];
                    localStorage.setItem('prepe_gift_vouchers', JSON.stringify(defaults));
                    setVouchers(defaults);
                }
            }
        } catch (e) {
            console.warn("Database gift_vouchers read skipped, using localStorage store.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !amount || !discount || !code) {
            toast.error("Please fill in all required fields");
            return;
        }

        setSubmitting(true);

        const amt = Number(amount);
        const disc = Number(discount);
        const price = amt - (amt * disc) / 100;
        const defaultBanner = bannerUrl || "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600";

        const newVoucher: GiftVoucher = {
            id: 'voucher_' + Math.random().toString(36).substr(2, 9),
            name,
            provider,
            amount: amt,
            price,
            discount: disc,
            code: code.toUpperCase(),
            bannerUrl: defaultBanner,
            description: description || `Flat ${disc}% discount on ${name}`,
            destinationUrl: destinationUrl || '',
            created_at: new Date().toISOString()
        };

        try {
            // Attempt DB Insert
            const { error } = await supabase
                .from('gift_vouchers' as any)
                .insert([newVoucher]);

            if (error) {
                // If table is missing, use LocalStorage fallback
                const updated = [newVoucher, ...vouchers];
                localStorage.setItem('prepe_gift_vouchers', JSON.stringify(updated));
                setVouchers(updated);
            } else {
                setVouchers(prev => [newVoucher, ...prev]);
            }

            toast.success("Gift Voucher created successfully!");
            // Reset form
            setName('');
            setAmount('');
            setDiscount('');
            setCode('');
            setBannerUrl('');
            setDescription('');
            setDestinationUrl('');
        } catch (err) {
            // Failover
            const updated = [newVoucher, ...vouchers];
            localStorage.setItem('prepe_gift_vouchers', JSON.stringify(updated));
            setVouchers(updated);
            toast.success("Gift Voucher created (saved to local registry)!");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this gift voucher?")) return;

        try {
            const { error } = await supabase
                .from('gift_vouchers' as any)
                .delete()
                .eq('id', id);

            if (error) {
                const updated = vouchers.filter(v => v.id !== id);
                localStorage.setItem('prepe_gift_vouchers', JSON.stringify(updated));
                setVouchers(updated);
            } else {
                setVouchers(prev => prev.filter(v => v.id !== id));
            }
            toast.success("Gift Voucher deleted successfully");
        } catch (err) {
            const updated = vouchers.filter(v => v.id !== id);
            localStorage.setItem('prepe_gift_vouchers', JSON.stringify(updated));
            setVouchers(updated);
            toast.success("Gift Voucher deleted successfully");
        }
    };

    const selectedProv = PROVIDERS.find(p => p.name === provider) || PROVIDERS[PROVIDERS.length - 1];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-8 bg-blue-600 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Inventory Operations</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        Gift Voucher Manager <Gift className="w-8 h-8 text-blue-600" />
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">Design, release and control executive promotional brand gift cards.</p>
                </div>
            </div>

            {/* Release Panel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <Card className="lg:col-span-7 border-slate-200/60 shadow-xl bg-white/90 backdrop-blur-xl overflow-hidden rounded-[2rem]">
                    <CardContent className="p-8">
                        <h2 className="text-xl font-black text-slate-950 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" /> Release New Voucher
                        </h2>

                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Brand Name</Label>
                                    <Input
                                        placeholder="e.g. Amazon Pay Gift Card"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Partner Provider</Label>
                                    <select
                                        value={provider}
                                        onChange={e => setProvider(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold text-slate-700"
                                    >
                                        {PROVIDERS.map(p => (
                                            <option key={p.name} value={p.name}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Face Value (₹)</Label>
                                    <Input
                                        type="number"
                                        placeholder="500"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        required
                                        className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Commission / Disc (%)</Label>
                                    <Input
                                        type="number"
                                        placeholder="5"
                                        value={discount}
                                        onChange={e => setDiscount(e.target.value)}
                                        required
                                        className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-bold text-emerald-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Promo Claim Code</Label>
                                    <Input
                                        placeholder="AMZ500"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        required
                                        className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-mono font-bold uppercase tracking-wider"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Banner Image URL (Unsplash/Imgur)</Label>
                                <Input
                                    placeholder="Leave blank for automatic provider banner theme"
                                    value={bannerUrl}
                                    onChange={e => setBannerUrl(e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium text-xs text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Redemption / Destination URL</Label>
                                <Input
                                    placeholder="e.g. https://amazon.in/redeem or custom redirection link"
                                    value={destinationUrl}
                                    onChange={e => setDestinationUrl(e.target.value)}
                                    className="h-11 rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium text-xs text-slate-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Voucher Offer Description</Label>
                                <Textarea
                                    placeholder="Details of the brand discount and standard redemption process..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="min-h-[90px] rounded-xl bg-slate-50/50 border-slate-200 focus:bg-white transition-all font-medium"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={submitting}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[11px] rounded-xl transition-all shadow-md active:scale-[0.99] gap-2"
                            >
                                <Plus className="w-4 h-4" /> release voucher to client app
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Real-time Visual Preview Card */}
                <div className="lg:col-span-5 space-y-6">
                    <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-blue-500" /> Live Client Preview
                    </h2>
                    
                    <div className="relative overflow-hidden rounded-[2.5rem] border-slate-200 shadow-2xl bg-white p-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                        
                        {/* Interactive Coupon */}
                        <div className="relative border border-slate-100 rounded-3xl overflow-hidden shadow-lg bg-slate-50/50">
                            {/* Card Image banner */}
                            <div className="h-40 bg-slate-200 relative overflow-hidden flex items-end p-5 text-white">
                                <div className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                                     style={{ backgroundImage: `url(${bannerUrl || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600'})` }} 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="relative z-10 w-full">
                                    <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white rounded-full px-2.5 py-0.5 mb-2">
                                        SAVE {discount || '0'}%
                                    </span>
                                    <h3 className="text-lg font-black tracking-tight leading-snug line-clamp-2">
                                        {name || 'BRAND VOUCHER TITLE'}
                                    </h3>
                                </div>
                            </div>
                            
                            {/* Coupon Body */}
                            <div className="p-5 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PRE-PE SPECIAL PRICE</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-slate-900">₹{amount ? (Number(amount) - (Number(amount) * (Number(discount) || 0)) / 100).toLocaleString() : '---'}</span>
                                            <span className="text-xs text-slate-400 font-medium line-through">₹{amount ? Number(amount).toLocaleString() : '---'}</span>
                                        </div>
                                    </div>
                                    <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl font-mono text-xs font-bold tracking-wider uppercase">
                                        {code || 'CLAIMCODE'}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {description || 'Interactive brand voucher details and redeem options will display here immediately.'}
                                </p>
                                <Button className="w-full bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] h-11 rounded-xl pointer-events-none">
                                    BUY VOUCHER INSTANTLY
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Vouchers Directory List */}
            <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-600" /> Active Released Registry ({vouchers.length})
                </h2>

                {loading ? (
                    <div className="h-40 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-400 animate-pulse">LOADING VOUCHERS...</span>
                    </div>
                ) : vouchers.length === 0 ? (
                    <div className="p-10 text-center border border-dashed border-slate-200 rounded-[2rem] bg-slate-50/50">
                        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No brand vouchers released yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {vouchers.map(v => (
                                <motion.div
                                    key={v.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                >
                                    <Card className="overflow-hidden border-slate-200 shadow-lg bg-white rounded-3xl group hover:shadow-xl transition-all duration-300">
                                        <div className="h-32 bg-slate-200 relative overflow-hidden flex items-end p-4 text-white">
                                            <div className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                                                 style={{ backgroundImage: `url(${v.bannerUrl})` }} 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="relative z-10 w-full">
                                                <Badge className="bg-emerald-600 text-white font-black text-[9px] uppercase px-2 mb-1 border-none">
                                                    SAVE {v.discount}%
                                                </Badge>
                                                <h3 className="font-extrabold text-md line-clamp-1 leading-none">{v.name}</h3>
                                            </div>
                                        </div>
                                        <div className="p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MEMBER PRICE</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-lg font-black text-slate-900">₹{v.price.toLocaleString()}</span>
                                                        <span className="text-xs text-slate-400 font-medium line-through">₹{v.amount.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-9 w-9 text-rose-500 hover:bg-rose-50 rounded-xl"
                                                    onClick={() => handleDelete(v.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                                {v.description}
                                            </p>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
