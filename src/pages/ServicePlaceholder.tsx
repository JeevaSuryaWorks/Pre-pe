import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  SmartphoneCharging, 
  Wifi, 
  Flame, 
  Droplets, 
  HandCoins, 
  ShieldCheck, 
  Car, 
  Sparkles, 
  ChevronLeft,
  Bell,
  Clock,
  Zap,
  Gift,
  ArrowRight,
  ShieldAlert
} from "lucide-react";

const getServiceDetails = (name?: string) => {
    const lower = name?.toLowerCase() || '';
    if (lower.includes('postpaid')) {
        return {
            title: 'Postpaid Mobile',
            icon: SmartphoneCharging,
            color: 'text-[#FF671F]',
            bgGlow: 'bg-[#FF671F]/10',
            borderGlow: 'border-[#FF671F]/20',
            features: [
                'Instant monthly bill fetching',
                'Auto-debit setup with UPI Autopay',
                'Earn flat 5% cashback on on-time payments',
                'Supports Airtel, Jio, Vi postpaid numbers'
            ]
        };
    }
    if (lower.includes('broadband')) {
        return {
            title: 'Broadband Bill',
            icon: Wifi,
            color: 'text-[#000080]',
            bgGlow: 'bg-[#000080]/10',
            borderGlow: 'border-[#000080]/20',
            features: [
                'Fiber speed connection lookup',
                'Instant operator payment receipt',
                '100% reliable connection updates',
                'Supports Act, JioFiber, Airtel Stream, BSNL'
            ]
        };
    }
    if (lower.includes('gas') || lower.includes('lpg')) {
        return {
            title: 'LPG Gas Booking',
            icon: Flame,
            color: 'text-[#FF671F]',
            bgGlow: 'bg-[#FF671F]/10',
            borderGlow: 'border-[#FF671F]/20',
            features: [
                'Instant booking confirmation with distributor',
                'Track gas delivery status in real-time',
                'Utilize reward points to get up to ₹150 off',
                'Supports Indane, HP, Bharat Gas'
            ]
        };
    }
    if (lower.includes('water')) {
        return {
            title: 'Water Bill',
            icon: Droplets,
            color: 'text-[#000080]',
            bgGlow: 'bg-[#000080]/10',
            borderGlow: 'border-[#000080]/20',
            features: [
                'Official municipality bill fetching',
                'Paperless billing reminder system',
                'Secure payment records with receipt PDF',
                'Supports DJB, HMWSSB, BWSSB, MCG etc.'
            ]
        };
    }
    if (lower.includes('pay-bills') || lower.includes('pay-emi') || lower.includes('loan')) {
        return {
            title: 'EMI & Loan Repayments',
            icon: HandCoins,
            color: 'text-[#046A38]',
            bgGlow: 'bg-[#046A38]/10',
            borderGlow: 'border-[#046A38]/20',
            features: [
                'EMI alerts and automatic scheduler',
                'Avoid late payment fees and boost credit score',
                '256-bit military grade secure payment gateway',
                'Supports L&T Finance, Bajaj Finserv, Muthoot, etc.'
            ]
        };
    }
    if (lower.includes('insurance')) {
        return {
            title: 'Insurance Premium',
            icon: ShieldCheck,
            color: 'text-[#046A38]',
            bgGlow: 'bg-[#046A38]/10',
            borderGlow: 'border-[#046A38]/20',
            features: [
                'Premium renewal reminders before due date',
                'Digital receipt storage in secure safe vault',
                'Flexible multiple payment options (UPI, Netbanking, Cards)',
                'Supports LIC, HDFC Ergo, ICICI Prudential, SBI Life'
            ]
        };
    }
    if (lower.includes('fastag') || lower.includes('fasttag')) {
        return {
            title: 'FASTAG Recharge',
            icon: Car,
            color: 'text-[#FF671F]',
            bgGlow: 'bg-[#FF671F]/10',
            borderGlow: 'border-[#FF671F]/20',
            features: [
                'Instant vehicle number lookup for details',
                'Toll balance checking tool',
                'Instant recharge credit to wallet in under 10 seconds',
                'Supports Paytm, ICICI, SBI, IDFC FASTag'
            ]
        };
    }
    if (lower.includes('electricity')) {
        return {
            title: 'Electricity Bill',
            icon: Zap,
            color: 'text-amber-500',
            bgGlow: 'bg-amber-500/10',
            borderGlow: 'border-amber-500/20',
            features: [
                'Realtime consumption tracking',
                '1-click bill clearing',
                'Saves historic bills securely',
                'Supports all major state electricity boards'
            ]
        };
    }
    if (lower.includes('gift-cards') || lower.includes('gift')) {
        return {
            title: 'Gift Vouchers',
            icon: Gift,
            color: 'text-[#FF671F]',
            bgGlow: 'bg-[#FF671F]/10',
            borderGlow: 'border-[#FF671F]/20',
            features: [
                'Instantly buy brand gift cards',
                'Redeem up to 10% cash reward points',
                'Send directly via SMS or Email',
                'Supports Amazon, Flipkart, Myntra, BookMyShow'
            ]
        };
    }

    return {
        title: name ? name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Utility Service',
        icon: Clock,
        color: 'text-[#000080]',
        bgGlow: 'bg-[#000080]/10',
        borderGlow: 'border-[#000080]/20',
        features: [
            'Instant service bill lookups',
            'Full support for BHIM UPI and major cards',
            'Safe, secure, and encrypted payment handling',
            'Assured rewards and flat cashbacks on every transaction'
        ]
    };
};

const ServicePlaceholder = () => {
    const { serviceName } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [contact, setContact] = useState("");
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(false);

    const details = getServiceDetails(serviceName);
    const Icon = details.icon;

    const handleNotify = (e: React.FormEvent) => {
        e.preventDefault();
        if (!contact.trim()) return;

        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setIsRegistered(true);
            toast({
                title: "Launch Notification Set!",
                description: `We'll update you as soon as ${details.title} payment is live.`,
            });
        }, 800);
    };

    return (
        <Layout hideHeader showBottomNav>
            <div className="min-h-screen bg-[#F8FAFC] pb-24">
                {/* Back Navigation Bar */}
                <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 shrink-0">
                  <div className="flex items-center gap-4 px-2">
                    <button 
                      onClick={() => navigate(-1)}
                      className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </button>
                    <h1 className="text-lg font-black text-slate-800 tracking-tight">{details.title} Coming Soon</h1>
                  </div>
                </div>

                <div className="p-4 flex flex-col items-center justify-center min-h-[75vh] text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-sm"
                    >
                        <div className="relative rounded-[36px] bg-white border border-slate-100 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden">
                            {/* Indian Flag Tri-color top stripe */}
                            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]" />

                            <div className="flex flex-col items-center pt-4">
                                {/* Coming Soon Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest mb-6 border border-amber-500/20 animate-pulse">
                                    <Sparkles className="w-3 h-3 text-amber-600" /> Coming Soon
                                </div>

                                {/* Glowing floating icon */}
                                <motion.div 
                                    animate={{ y: [0, -6, 0] }}
                                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                    className={cn("w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 border relative", details.bgGlow, details.borderGlow)}
                                >
                                    <div className={cn("absolute inset-0 rounded-[2rem] opacity-5 blur-xl animate-pulse bg-current", details.color)} />
                                    <Icon className={cn("w-9 h-9", details.color)} strokeWidth={1.8} />
                                </motion.div>

                                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2 leading-none">
                                    {details.title}
                                </h2>
                                
                                <p className="text-xs font-semibold text-slate-500 mb-6 leading-relaxed max-w-[280px]">
                                    We are presently integrating this Bharat Connect service. Get ready for 1-click bills and instant rewards!
                                </p>

                                {/* Features List */}
                                <div className="w-full space-y-3.5 text-left bg-slate-50 p-4.5 rounded-[24px] border border-slate-100 mb-6">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Planned Features</p>
                                    {details.features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <div className={cn("h-4.5 w-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5", details.bgGlow)}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full", details.color.replace('text-', 'bg-'))} />
                                            </div>
                                            <span className="text-xs font-bold text-slate-600 leading-snug">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Notification form */}
                                <div className="w-full border-t border-slate-100 pt-6">
                                    {isRegistered ? (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex items-center justify-center gap-2.5"
                                        >
                                            <ShieldAlert className="w-5 h-5 text-emerald-600 shrink-0" />
                                            <span className="text-xs font-black uppercase tracking-wider">You will be notified!</span>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleNotify} className="space-y-3">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Be the first to know when it goes live</p>
                                            <div className="flex gap-2">
                                                <Input 
                                                    type="text" 
                                                    placeholder="Enter Mobile / Email"
                                                    value={contact}
                                                    onChange={(e) => setContact(e.target.value)}
                                                    className="h-12 bg-slate-50 border-slate-100 rounded-xl text-xs font-bold focus-visible:ring-2 focus-visible:ring-blue-500/10 placeholder:text-slate-400"
                                                    required
                                                />
                                                <Button 
                                                    type="submit" 
                                                    disabled={loading}
                                                    className="h-12 w-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shrink-0 p-0"
                                                >
                                                    {loading ? (
                                                        <Clock className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Bell className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </Layout>
    );
};

export default ServicePlaceholder;
