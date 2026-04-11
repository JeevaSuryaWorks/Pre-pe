import { 
  Smartphone, 
  Tv, 
  Lightbulb, 
  Play, 
  Car, 
  Flame, 
  Droplets, 
  SmartphoneCharging, 
  HandCoins, 
  ShieldCheck, 
  Wifi,
  ChevronLeft,
  Search,
  Zap,
  CreditCard,
  HeartPulse,
  Receipt,
  FilePlus2,
  Lock
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useKYC } from "@/hooks/useKYC";
import { useToast } from "@/hooks/use-toast";
import { usePlanLimits } from "@/hooks/usePlanLimits";

const services = [
  {
    category: "Recharge",
    items: [
      { icon: Smartphone, label: "Mobile Recharge", path: "/mobile-recharge", color: "bg-blue-50 text-blue-600" },
      { icon: Tv, label: "DTH", path: "/dth-recharge", color: "bg-purple-50 text-purple-600" },
      { icon: Play, label: "Google Play", path: "/services/redeem-code", color: "bg-green-50 text-green-600" },
      { icon: SmartphoneCharging, label: "Postpaid", path: "/postpaid", color: "bg-indigo-50 text-indigo-600" },
      { icon: FilePlus2, label: "Bulk Recharge", path: "/business/bulk-recharge", color: "bg-amber-50 text-amber-600", businessOnly: true },
    ]
  },
  {
    category: "Utilities",
    items: [
      { icon: Lightbulb, label: "Electricity", path: "/services/electricity", color: "bg-yellow-50 text-yellow-600" },
      { icon: Droplets, label: "Water", path: "/services/water-bill", color: "bg-cyan-50 text-cyan-600" },
      { icon: Flame, label: "LPG Gas", path: "/services/gas-bill", color: "bg-orange-50 text-orange-600" },
      { icon: Wifi, label: "Broadband", path: "/services/broadband", color: "bg-blue-50 text-blue-600" },
      { icon: Zap, label: "Piped Gas", path: "/services/piped-gas", color: "bg-red-50 text-red-600" },
    ]
  },
  {
    category: "Financial & Others",
    items: [
      { icon: ShieldCheck, label: "Insurance", path: "/services/insurance", color: "bg-emerald-50 text-emerald-600" },
      { icon: HandCoins, label: "Loan Repayment", path: "/services/pay-bills", color: "bg-indigo-50 text-indigo-600" },
      { icon: Car, label: "FasTag", path: "/services/fasttag", color: "bg-slate-50 text-slate-600" },
      { icon: HeartPulse, label: "Health", path: "/services/health", color: "bg-rose-50 text-rose-600" },
      { icon: CreditCard, label: "Credit Card", path: "/services/credit-card", color: "bg-slate-800 text-white" },
      { icon: Receipt, label: "Municipal Tax", path: "/services/tax", color: "bg-teal-50 text-teal-600" },
    ]
  }
];

export default function ServicesPage() {
  const navigate = useNavigate();
  const { isApproved } = useKYC();
  const { isFeatureEnabled, planId } = usePlanLimits();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const filteredServices = services.map(cat => ({
    ...cat,
    items: cat.items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  const handleServiceClick = (e: React.MouseEvent, path: string) => {
    if (!isApproved) {
      e.preventDefault();
      toast({
        title: "KYC Required",
        description: "Please complete and wait for KYC approval to use this service.",
        variant: "destructive"
      });
      return;
    }

    // Check Business Tools
    const service = services.flatMap(c => c.items).find(i => i.path === path);
    if (service?.businessOnly && !isFeatureEnabled('bulkTools')) {
       e.preventDefault();
       toast({
         title: "Business Plan Required",
         description: "Bulk tools are exclusively for our Business Plan partners.",
       });
       navigate('/onboarding/plans');
       return;
    }
  };

  return (
    <Layout hideHeader>
      <div className="min-h-screen bg-[#F8FAFC]">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 p-4">
          <div className="flex items-center gap-4 max-w-2xl mx-auto">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search for a service..."
                className="pl-10 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-blue-500/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-4 pb-24">
          <div className="mb-8 mt-4 px-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">All Services</h1>
            <p className="text-slate-500 mt-1">Pay all your bills and recharges securely</p>
          </div>

          <div className="space-y-10">
            {filteredServices.map((section, idx) => (
              <div key={idx} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.2em] px-2">{section.category}</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {section.items.map((item, i) => (
                    <Link
                      key={i}
                      to={isApproved ? item.path : "#"}
                      onClick={(e) => handleServiceClick(e, item.path)}
                      className={`flex flex-col items-center gap-2.5 p-4 bg-white rounded-3xl border border-slate-100 transition-all group ${
                        !isApproved 
                          ? "opacity-50 grayscale scale-[0.98]" 
                          : "hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5"
                      }`}
                    >
                      <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center ${isApproved && "group-hover:scale-110"} transition-transform`}>
                        <item.icon className="w-7 h-7" strokeWidth={1.5} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 text-center leading-tight">
                        {item.label}
                        {item.businessOnly && <span className="block text-[8px] text-amber-600 font-black mt-0.5">BUSINESS</span>}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {filteredServices.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-400">No services found for "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
