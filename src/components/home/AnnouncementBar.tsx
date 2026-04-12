import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Announcement {
    id: string;
    title: string;
    cta_link: string;
}

export const AnnouncementBar = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [active, setActive] = useState(0);
    const [visible, setVisible] = useState(true);

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await (supabase as any)
                .from('banners')
                .select('id, title, cta_link')
                .eq('status', 'published')
                .eq('type', 'announcement')
                .order('sort_order', { ascending: true });
            
            if (error) {
                // If columns are missing, try a generic fetch
                if (error.code === '42703' || error.message?.includes('column')) {
                    const { data: fallback } = await (supabase as any)
                        .from('banners')
                        .select('*')
                        .limit(3);
                    if (fallback) {
                        setAnnouncements(fallback.map((a: any) => ({
                            id: a.id,
                            title: a.title,
                            cta_link: a.cta_link
                        })));
                        return;
                    }
                }
                console.warn("Announcement fetch failed:", error.message);
                return;
            }

            if (data) {
                setAnnouncements(data);
            }
        } catch (err) {
            console.error("Critical announcement fetch failure:", err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();

        const channel = supabase
            .channel('announcements_public')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, () => {
                fetchAnnouncements();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    // Rotate through announcements if multiple
    useEffect(() => {
        if (announcements.length <= 1) return;
        const interval = setInterval(() => {
            setActive(prev => (prev + 1) % announcements.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [announcements.length]);

    if (!visible || announcements.length === 0) return null;

    const item = announcements[active];

    return (
        <div className="relative w-full overflow-hidden bg-slate-900 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 animate-pulse" />
            
            <div className="relative flex items-center justify-center min-h-[40px] px-8 py-2">
                <div className="flex items-center gap-3 max-w-full">
                    <div className="bg-blue-600 rounded-full p-1 shrink-0 animate-bounce shadow-[0_0_10px_rgba(37,99,235,0.5)]">
                        <Megaphone className="w-3 h-3 text-white" />
                    </div>
                    
                    <button 
                        onClick={() => item.cta_link && item.cta_link !== '#' && window.open(item.cta_link, '_blank')}
                        className="group flex items-center gap-2 text-center"
                    >
                        <p className="text-[11px] font-black tracking-wide uppercase truncate max-w-[280px]">
                            {item.title}
                        </p>
                        {item.cta_link && item.cta_link !== '#' && (
                            <ArrowRight className="w-3 h-3 opacity-60 group-hover:translate-x-1 transition-transform" />
                        )}
                    </button>
                </div>

                <button 
                    onClick={() => setVisible(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X className="w-3.5 h-3.5 text-white/50 hover:text-white" />
                </button>
            </div>

            {/* Pagination dots if multiple */}
            {announcements.length > 1 && (
                <div className="absolute bottom-1 left-12 right-12 flex justify-center gap-1">
                    {announcements.map((_, i) => (
                        <div key={i} className={cn(
                            "h-[2px] rounded-full transition-all duration-300",
                            i === active ? "w-4 bg-blue-500" : "w-1 bg-white/20"
                        )} />
                    ))}
                </div>
            )}
        </div>
    );
};
