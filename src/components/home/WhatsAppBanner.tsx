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
    sort_order: number;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
    MessageCircle, Zap, Gift, Shield, Megaphone,
    Star, Bell, Rocket, Heart, CheckCircle2, Globe,
};

// Fallback banners if DB is unreachable
const FALLBACK: Banner[] = [
    {
        id: 'f1', title: 'Be A Part Of Our WhatsApp Community.', subtitle: 'Stay Connected, Stay Ahead With @Pre Pe Updates',
        tag: 'Community', cta_text: 'JOIN NOW', cta_link: 'https://chat.whatsapp.com/',
        grad_from: '#065f46', grad_to: '#16a34a', icon_name: 'MessageCircle', sort_order: 1,
    },
];

export const WhatsAppBanner = () => {
    const [banners, setBanners] = useState<Banner[]>(FALLBACK);
    const [active, setActive] = useState(0);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Load published banners from Supabase
    const fetchBanners = async () => {
        const { data, error } = await (supabase as any)
            .from('banners')
            .select('id,title,subtitle,tag,cta_text,cta_link,grad_from,grad_to,icon_name,sort_order')
            .eq('status', 'published')
            .order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) {
            setBanners(data);
            setActive(0);
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

    return (
        <div className="mx-4 mt-4">
            <div
                className="relative overflow-hidden rounded-2xl text-white shadow-lg transition-all duration-500"
                style={{ background: `linear-gradient(to right, ${b.grad_from}, ${b.grad_to})` }}
            >
                {/* Blur blobs */}
                <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full blur-2xl opacity-30 bg-white/30 transition-all duration-500" />
                <div className="absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-20 bg-white/20 transition-all duration-500" />

                <div className="relative z-10 p-5 flex items-center gap-4">
                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-white/20 rounded-full px-2.5 py-0.5 mb-2">
                            {b.tag}
                        </span>
                        <h3 className="text-base font-extrabold text-white leading-snug mb-1.5 whitespace-pre-line">
                            {b.title}
                        </h3>
                        <p className="text-[10px] text-white/75 mb-3 line-clamp-2">{b.subtitle}</p>
                        <Button
                            size="sm"
                            className="rounded-full px-5 h-8 text-xs font-black border-none bg-white/25 hover:bg-white/35 text-white shadow transition-all hover:scale-105 active:scale-95"
                            onClick={() => b.cta_link && b.cta_link !== '#' && window.open(b.cta_link, '_blank')}
                        >
                            {b.cta_text}
                        </Button>
                    </div>

                    {/* Icon */}
                    <div className="shrink-0 w-16 h-16 flex items-center justify-center opacity-90">
                        <Icon className="w-12 h-12" />
                    </div>
                </div>

                {/* Prev / Next arrows (only if more than 1 banner) */}
                {banners.length > 1 && (
                    <>
                        <button onClick={prev}
                            className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all">
                            <ChevronLeft className="w-3.5 h-3.5 text-white" />
                        </button>
                        <button onClick={next}
                            className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-all">
                            <ChevronRight className="w-3.5 h-3.5 text-white" />
                        </button>
                    </>
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
