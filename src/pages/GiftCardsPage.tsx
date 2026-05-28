import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Gift, ArrowLeft, Search, Wallet, Sparkles, Copy, Check, Ticket, ShoppingCart 
} from 'lucide-react';
import { BrandLoader, PrePeSpinner } from '@/components/ui/BrandLoader';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface GiftVoucher {
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

const FEATURED_BANNERS = [
    {
        title: "Amazon Festival Cashback",
        subtitle: "Flat 5% instant discount on shopping vouchers.",
        grad: "from-[#FF9900] to-[#E47911]",
        tag: "Festival Live",
        bgUrl: "https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Google Play Epic Play",
        subtitle: "Unlock premium items and game points at 4% discount.",
        grad: "from-[#4285F4] to-[#34A853]",
        tag: "Best Seller",
        bgUrl: "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&q=80&w=800"
    },
    {
        title: "Netflix Binge Upgrade",
        subtitle: "Deduct directly from wallet to claim entertainment codes.",
        grad: "from-[#E50914] to-[#B81D24]",
        tag: "Trending",
        bgUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8edd86?auto=format&fit=crop&q=80&w=800"
    }
];

export default function GiftCardsPage() {
    const navigate = useNavigate();
    const { profile } = useProfile();
    
    const [vouchers, setVouchers] = useState<GiftVoucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [activeBannerIdx, setActiveBannerIdx] = useState(0);

    // Purchase Dialog States
    const [selectedVoucher, setSelectedVoucher] = useState<GiftVoucher | null>(null);
    const [purchaseDialog, setPurchaseDialog] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [purchasedCode, setPurchasedCode] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadVouchers();
        loadWallet();

        // Banner carousel rotation
        const interval = setInterval(() => {
            setActiveBannerIdx(prev => (prev + 1) % FEATURED_BANNERS.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [profile]);

    const loadWallet = async () => {
        if (!profile?.user_id) return;
        try {
            const { data } = await supabase
                .from('wallets')
                .select('balance')
                .eq('user_id', profile.user_id)
                .maybeSingle();
            if (data) {
                setWalletBalance(data.balance);
            }
        } catch (e) {
            console.error("Wallet loading skipped");
        }
    };

    const loadVouchers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('gift_vouchers' as never)
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                const mapped = (data as any[]).map(v => ({
                    id: v.id,
                    name: v.name,
                    provider: v.provider || '',
                    amount: Number(v.amount),
                    price: Number(v.price || v.amount),
                    discount: Number(v.discount || 0),
                    code: v.code || '',
                    bannerUrl: v.banner_url || v.bannerUrl || 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?auto=format&fit=crop&q=80&w=600',
                    description: v.description || '',
                    created_at: v.created_at
                }));
                setVouchers(mapped);
                setLoading(false);
                return;
            }
        } catch (e) {
            console.error("Failed to fetch gift vouchers from Supabase, loading fallback:", e);
        }

        try {
            // Read directly from LocalStorage as fallback
            const local = localStorage.getItem('prepe_gift_vouchers');
            if (local) {
                setVouchers(JSON.parse(local));
            } else {
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
        } catch (e) {
            console.error("Using localStorage voucher registry error:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBuyVoucher = async () => {
        if (!profile?.user_id || !selectedVoucher) return;

        setPurchasing(true);
        try {
            // 1. Fetch live balance
            const { data: wallet, error: fetchErr } = await supabase
                .from('wallets')
                .select('*')
                .eq('user_id', profile.user_id)
                .maybeSingle();

            if (fetchErr || !wallet) {
                toast.error("Failed to verify wallet balance");
                setPurchasing(false);
                return;
            }

            if (wallet.balance < selectedVoucher.price) {
                toast.error(`Insufficient balance. You need ₹${(selectedVoucher.price - wallet.balance).toFixed(2)} more in your wallet.`);
                setPurchasing(false);
                return;
            }

            // 2. Perform balance deduction
            const nextBalance = wallet.balance - selectedVoucher.price;
            const { error: updateErr } = await supabase
                .from('wallets')
                .update({ balance: nextBalance })
                .eq('id', wallet.id);

            if (updateErr) throw updateErr;

            // 3. Log ledger debit transaction
            await supabase
                .from('wallet_ledger' as never)
                .insert({
                    wallet_id: wallet.id,
                    type: 'DEBIT',
                    amount: selectedVoucher.price,
                    balance_after: nextBalance,
                    description: `Purchased Gift Voucher: ${selectedVoucher.name} (${selectedVoucher.code})`,
                } as never);

            // 4. Update UI wallet balance
            setWalletBalance(nextBalance);
            setPurchasedCode(selectedVoucher.code);
            toast.success("Voucher purchased successfully!");
        } catch (err) {
            toast.error("Voucher purchase failed. Please try again.");
        } finally {
            setPurchasing(false);
        }
    };

    const copyCode = () => {
        if (!purchasedCode) return;
        navigator.clipboard.writeText(purchasedCode);
        setCopied(true);
        toast.success("Promo code copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const filtered = vouchers.filter(v => 
        v.name.toLowerCase().includes(search.toLowerCase()) || 
        v.provider.toLowerCase().includes(search.toLowerCase())
    );

    const activeBanner = FEATURED_BANNERS[activeBannerIdx];

    return (
        <Layout hideHeader showBottomNav>
            <div className="min-h-screen bg-slate-50/50 pb-32">
                {/* Header Navbar */}
                <div className="bg-slate-900 text-white px-5 pt-8 pb-5 flex items-center justify-between sticky top-0 z-30 shadow-md">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full text-white hover:bg-white/10 h-10 w-10 shrink-0"
                            onClick={() => navigate('/home')}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 uppercase text-orange-400">
                                Gift Vouchers <Gift className="w-4 h-4 text-emerald-400" />
                            </h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Digital India Brand Cards</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
                        <Wallet className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-[11px] font-black tracking-tight tabular-nums">
                            ₹{walletBalance !== null ? walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '...'}
                        </span>
                    </div>
                </div>

                {/* Industrial Banner Page Hero ("as Banner page and all") */}
                <div className="px-5 mt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeBannerIdx}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.5 }}
                            className="relative overflow-hidden rounded-[2.5rem] p-6 text-white h-48 flex flex-col justify-end shadow-xl"
                        >
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                                 style={{ backgroundImage: `url(${activeBanner.bgUrl})` }} />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
                            
                            <div className="relative z-10 space-y-1">
                                <Badge className="bg-orange-500 border-none font-black text-[9px] uppercase tracking-widest py-0.5 px-2.5 mb-1 w-fit">
                                    {activeBanner.tag}
                                </Badge>
                                <h2 className="text-xl font-black tracking-tight">{activeBanner.title}</h2>
                                <p className="text-xs text-slate-200/90 font-medium">{activeBanner.subtitle}</p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Carousel Indicators */}
                    <div className="flex justify-center gap-1.5 mt-3">
                        {FEATURED_BANNERS.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveBannerIdx(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === activeBannerIdx ? 'w-6 bg-slate-900' : 'w-1.5 bg-slate-300'}`}
                            />
                        ))}
                    </div>
                </div>

                {/* Controls & Search */}
                <div className="px-5 mt-6">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-slate-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by brand, category or promo..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-12 pl-11 pr-5 bg-white border border-slate-200 rounded-2xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-slate-800"
                        />
                    </div>
                </div>

                {/* Vouchers Grid Section */}
                <div className="px-5 mt-6 space-y-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Ticket className="w-4 h-4 text-orange-400" /> Active Voucher Catalogue ({filtered.length})
                    </h3>

                    {loading ? (
                        <div className="h-40 flex flex-col items-center justify-center gap-2">
                            <BrandLoader size="md" />
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Syncing Partner Registry</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-10 text-center bg-white border border-slate-200 rounded-3xl">
                            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No brand vouchers match your criteria</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {filtered.map((v, i) => (
                                <motion.div
                                    key={v.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card className="overflow-hidden border border-slate-200 shadow-md bg-white rounded-3xl flex flex-col sm:flex-row hover:shadow-lg transition-shadow duration-300">
                                        {/* Card Image Left/Top */}
                                        <div className="h-32 sm:h-auto sm:w-44 bg-slate-200 relative overflow-hidden flex items-end p-4 text-white shrink-0">
                                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${v.bannerUrl})` }} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
                                            <div className="relative z-10 w-full">
                                                <Badge className="bg-emerald-500 text-white font-black text-[8px] uppercase tracking-widest px-2.5 py-0.5 border-none mb-1">
                                                    SAVE {v.discount}%
                                                </Badge>
                                                <h4 className="font-extrabold text-sm line-clamp-1 leading-none">{v.provider}</h4>
                                            </div>
                                        </div>

                                        {/* Voucher Info */}
                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <div className="space-y-1">
                                                <h3 className="font-black text-slate-900 text-md leading-tight">{v.name}</h3>
                                                <p className="text-[11px] text-slate-500 font-semibold line-clamp-2 leading-relaxed">{v.description}</p>
                                            </div>

                                            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">MEMBER PRICE</span>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-xl font-black text-slate-900">₹{v.price.toLocaleString()}</span>
                                                        <span className="text-xs text-slate-400 font-medium line-through">₹{v.amount.toLocaleString()}</span>
                                                    </div>
                                                </div>

                                                <Button 
                                                    className="bg-slate-900 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-[9px] h-9 px-4 rounded-xl transition-all shadow-md active:scale-95 gap-1.5"
                                                    onClick={() => {
                                                        setSelectedVoucher(v);
                                                        setPurchasedCode(null);
                                                        setPurchaseDialog(true);
                                                    }}
                                                >
                                                    <ShoppingCart className="w-3.5 h-3.5" /> Claim Card
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Claim Confirmation & Receipt Dialog */}
            <Dialog open={purchaseDialog} onOpenChange={setPurchaseDialog}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            {purchasedCode ? 'Voucher Claimed!' : 'Confirm Claiming Brand Card'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 mt-2 leading-relaxed">
                            {purchasedCode 
                                ? 'Your digital prepaid card code is active and ready to claim on the merchant dashboard.' 
                                : `Verify face value details and price before claiming with your active Pre-pe wallet balance.`
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {selectedVoucher && (
                        <div className="space-y-4">
                            {/* Card visual strip */}
                            <div className="relative overflow-hidden h-28 rounded-2xl p-4 text-white flex flex-col justify-end"
                                 style={{ backgroundImage: `url(${selectedVoucher.bannerUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                <div className="absolute inset-0 bg-black/75" />
                                <div className="relative z-10">
                                    <span className="inline-block text-[8px] font-black uppercase tracking-widest bg-emerald-500 px-2 py-0.5 rounded-full mb-1">
                                        SAVE {selectedVoucher.discount}% INSTANT
                                    </span>
                                    <h4 className="font-extrabold text-sm line-clamp-1">{selectedVoucher.name}</h4>
                                </div>
                            </div>

                            {purchasedCode ? (
                                /* Success State */
                                <div className="space-y-4 py-4 text-center">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                                        <Sparkles className="w-8 h-8" />
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Claim Code (Tap to Copy)</p>
                                        <button 
                                            onClick={copyCode}
                                            className="w-full py-4 bg-slate-50 border-2 border-dashed border-blue-200 hover:bg-slate-100 rounded-2xl font-mono text-xl font-black uppercase tracking-wider text-blue-700 flex items-center justify-center gap-2 transition-colors"
                                        >
                                            {selectedVoucher.code}
                                            {copied ? <Check className="w-5 h-5 text-emerald-600 animate-pulse" /> : <Copy className="w-5 h-5 opacity-60" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium italic">Enter this code during merchant checkout to claim your ₹{selectedVoucher.amount} balance.</p>
                                </div>
                            ) : (
                                /* Confirmation state */
                                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">FACE VALUE</span>
                                        <span className="font-bold text-slate-800">₹{selectedVoucher.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">CASHBACK / DISCOUNT</span>
                                        <span className="font-bold text-emerald-600">-{selectedVoucher.discount}%</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200">
                                        <span className="font-black text-slate-900 uppercase tracking-widest text-[11px]">NET DEDUCTION</span>
                                        <span className="font-black text-xl text-slate-900">₹{selectedVoucher.price.toLocaleString()}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter className="mt-6 gap-3 sm:gap-0">
                        {purchasedCode ? (
                            <div className="flex flex-col gap-2 w-full">
                                {selectedVoucher.destinationUrl && (
                                    <Button
                                        onClick={() => window.open(selectedVoucher.destinationUrl, '_blank')}
                                        className="w-full rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 flex items-center justify-center"
                                    >
                                        <Sparkles className="w-4 h-4" /> Redeem on Merchant Portal
                                    </Button>
                                )}
                                <Button 
                                    onClick={() => setPurchaseDialog(false)} 
                                    className="w-full rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 bg-slate-900 hover:bg-black text-white"
                                >
                                    Close Receipt
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Button 
                                    variant="ghost" 
                                    onClick={() => setPurchaseDialog(false)} 
                                    disabled={purchasing}
                                    className="rounded-2xl font-semibold text-slate-500 h-12 hover:bg-slate-100"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleBuyVoucher}
                                    disabled={purchasing}
                                    className="rounded-2xl font-black uppercase tracking-widest text-[10px] h-12 px-6 bg-slate-900 hover:bg-orange-600 text-white shadow-lg active:scale-95 transition-all gap-2"
                                >
                                    {purchasing ? <PrePeSpinner className="w-5 h-5" /> : <><Sparkles className="w-4 h-4" /> Confirm & Claim</>}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
