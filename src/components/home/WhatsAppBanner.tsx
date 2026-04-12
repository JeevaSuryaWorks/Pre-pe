import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
    MessageCircle, Zap, Gift, Shield, Megaphone,
    Star, Bell, Rocket, Heart, CheckCircle2, Globe,
    ChevronLeft, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    style: 'card' | 'voucher';
    image_url?: string;
    sort_order: number;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    MessageCircle, Zap, Gift, Shield, Megaphone,
    Star, Bell, Rocket, Heart, CheckCircle2, Globe,
};

// Fallback banners if DB is unreachable
const FALLBACK: Banner[] = [
    {
        id: 'f1', title: 'Executive WhatsApp Community', subtitle: 'Stay priority-connected with exclusive Prepe updates.',
        tag: 'Community', cta_text: 'JOIN NOW', cta_link: 'https://chat.whatsapp.com/',
        grad_from: '#064e3b', grad_to: '#059669', icon_name: 'MessageCircle', style: 'card', sort_order: 1,
    },
    {
        id: 'f2', title: 'Flipkart Shopping Gift Card', subtitle: 'Get flat 1.5% instant cashback on all Flipkart vouchers.',
        tag: 'Shopping', cta_text: 'BUY NOW', cta_link: '/services/gift-cards',
        grad_from: '#2563eb', grad_to: '#2563eb', icon_name: 'Gift', style: 'voucher', sort_order: 2,
    },
];

export const WhatsAppBanner = () => {
    const [banners, setBanners] = useState<Banner[]>(FALLBACK);
    const [active, setActive] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load published banners from Supabase
    const fetchBanners = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('banners')
                .select('id,title,subtitle,tag,cta_text,cta_link,grad_from,grad_to,icon_name,style,image_url,sort_order')
                .eq('status', 'published')
                .eq('type', 'banner')
                .order('sort_order', { ascending: true });

            if (error) {
                // Handle missing columns gracefully
                if (error.code === '42703' || error.message?.includes('column')) {
                    console.warn("Banners table missing columns for Home. Using generic fetch.");
                    const { data: fallbackData } = await (supabase as any)
                        .from('banners')
                        .select('*')
                        .limit(5);
                    if (fallbackData && fallbackData.length > 0) {
                        setBanners(fallbackData);
                        setActive(0);
                        return;
                    }
                }
                // If table doesn't exist or other error, fallback to static defaults
                console.error("Banner fetch error:", error);
                setBanners(FALLBACK);
                return;
            }

            if (data && data.length > 0) {
                setBanners(data);
                setActive(0);
            }
        } catch (err) {
            console.error("Critical banner fetch failure:", err);
            setBanners(FALLBACK);
        }
    };

    useEffect(() => {
        fetchBanners();

        // Realtime: re-fetch whenever banners table changes
        const channel = supabase
            .channel('banners_public')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
                fetchBanners();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Auto-scroll timer
    const startTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (banners.length < 2) return;
        timerRef.current = setInterval(() => {
            setActive(prev => (prev + 1) % banners.length);
        }, 4500);
    };

    useEffect(() => {
        startTimer();
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [banners.length]);

    const goTo = (idx: number) => { setActive(idx); startTimer(); };
    const prev = () => goTo((active - 1 + banners.length) % banners.length);
    const next = () => goTo((active + 1) % banners.length);

    if (banners.length === 0) return null;

    const b = banners[active];
    const Icon = ICON_MAP[b.icon_name] || MessageCircle;
    const isVoucher = b.style === 'voucher';

    return (
        <div className="mx-4 mt-4 relative">
            <div
                onClick={() => b.cta_link && b.cta_link !== '#' && window.open(b.cta_link, '_blank')}
                className={cn(
                    "relative overflow-hidden transition-all duration-500 cursor-pointer shadow-lg",
                    isVoucher ? "rounded-2xl p-0.5" : "rounded-2xl"
                )}
                style={isVoucher ? { backgroundColor: b.grad_from } : { background: `linear-gradient(to right, ${b.grad_from}, ${b.grad_to})` }}
            >
                {/* Standard Card Layout */}
                {!isVoucher && (
                    <>
                        <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full blur-2xl opacity-30 bg-white/30 transition-all duration-500" />
                        <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20 bg-white/20 transition-all duration-500" />

                        <div className="relative z-10 p-5 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <span className="inline-block text-[9px] font-black uppercase tracking-[0.2em] bg-white/30 backdrop-blur-md border border-white/20 text-white rounded-full px-3 py-1 mb-3">
                                    {b.tag}
                                </span>
                                <h3 className="text-lg font-black text-white leading-tight mb-1.5 whitespace-pre-line tracking-tight">
                                    {b.title}
                                </h3>
                                <p className="text-[11px] font-medium text-emerald-50/70 mb-4 line-clamp-2 leading-relaxed">
                                    {b.subtitle}
                                </p>
                                <Button
                                    size="sm"
                                    className="rounded-xl px-6 h-9 text-[11px] font-black border-none bg-white text-emerald-900 shadow-xl hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                                >
                                    {b.cta_text}
                                </Button>
                            </div>

                            <div className="shrink-0 w-20 h-20 flex items-center justify-center relative">
                                {b.image_url ? (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
                                        <img src={b.image_url} alt="banner" className="relative w-16 h-16 object-contain rounded-lg drop-shadow-2xl" />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full" />
                                        <Icon className="w-12 h-12 text-white/90 drop-shadow-lg relative" strokeWidth={1.5} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Voucher / Ticket Layout */}
                {isVoucher && (
                    <div className="flex bg-white rounded-[14px] overflow-hidden">
                        {/* Left Section */}
                        <div className="flex-1 p-5 relative min-h-[110px] flex flex-col justify-center">
                            {/* Edge cut-outs */}
                            <div className="absolute -left-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.grad_from }} />)}
                            </div>

                            <div className="flex items-center gap-2.5 mb-2">
                                {b.image_url ? (
                                    <img src={b.image_url} alt="logo" className="w-7 h-7 object-contain" />
                                ) : (
                                    <Icon className="w-6 h-6" style={{ color: b.grad_from }} />
                                )}
                                <span className="text-sm font-black text-slate-800 tracking-tight">{b.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                                    {b.tag}
                                </span>
                            </div>
                        </div>

                        {/* Dashed Line */}
                        <div className="relative w-px border-r border-dashed my-3 opacity-20" style={{ borderColor: b.grad_from }}>
                            <div className="absolute -top-4 -left-1.5 w-3 h-3 rounded-full" style={{ backgroundColor: b.grad_from }} />
                            <div className="absolute -bottom-4 -left-1.5 w-3 h-3 rounded-full" style={{ backgroundColor: b.grad_from }} />
                        </div>

                        {/* Right Section / Discount Box */}
                        <div className="w-28 p-3 flex items-center justify-center relative">
                            <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                                {[1, 2, 3, 4].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.grad_from }} />)}
                            </div>

                            <div className="w-full h-full rounded-xl flex flex-col items-center justify-center p-2 group-hover:scale-105 transition-transform" style={{ backgroundColor: `${b.grad_from}10`, border: `1px dashed ${b.grad_from}40` }}>
                                <span className="text-[9px] font-black uppercase mb-0.5" style={{ color: b.grad_from }}>REDEEM</span>
                                <span className="text-sm font-black leading-none text-center px-1" style={{ color: b.grad_from }}>{b.cta_text}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Dot indicators */}
                {banners.length > 1 && (
                    <div className="relative z-10 flex justify-center gap-1.5 pb-3">
                        {banners.map((_, i) => (
                            <button key={i} onClick={() => goTo(i)}
                                className={cn(
                                    "rounded-full transition-all duration-300",
                                    i === active ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"
                                )}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
