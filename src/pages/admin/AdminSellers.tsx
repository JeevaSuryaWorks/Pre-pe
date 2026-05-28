import { useState, useEffect } from "react";
import { shopService } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle, XCircle, Clock, Building, User, Phone,
  FileText, Clipboard, Search, ShieldCheck
} from "lucide-react";
import { BrandLoader } from '@/components/ui/BrandLoader';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminSellers() {
  const { toast } = useToast();

  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingSellers();
  }, []);

  const loadPendingSellers = async () => {
    setLoading(true);
    try {
      const data = await shopService.getPendingSellers();
      setSellers(data);
    } catch (err) {
      console.error("Pending sellers load failed:", err);
      toast({
        title: "Database Error",
        description: "Failed to load pending merchant applications.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await shopService.approveSeller(id, approve);
      toast({
        title: approve ? "Merchant Approved 🤝" : "Application Rejected ❌",
        description: approve
          ? "The seller account has been activated and is now live."
          : "The application was rejected successfully."
      });
      loadPendingSellers();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to update seller status.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <BrandLoader size="md" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gathering Onboardings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Overview Card */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#000080] shadow-sm">
          <Building className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-[#000080] uppercase tracking-wider">Merchant Onboardings</h2>
          <p className="text-xs text-slate-400 font-medium">Verify company GSTINs and approve mobile gear vendors.</p>
        </div>
      </div>

      {/* Listing Grid */}
      <div className="space-y-4">
        {sellers.map((seller) => (
          <motion.div
            key={seller.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4 transition-all hover:shadow-md"
          >
            {/* Header info */}
            <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-50">
              <div className="space-y-0.5">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Company name</span>
                <h4 className="text-sm font-black text-slate-800">{seller.company_name}</h4>
              </div>
              <div className="px-3 py-1 bg-amber-50 border border-amber-100 rounded-full text-[8px] font-black uppercase text-amber-600 tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3" /> PENDING KYC
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-650">
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">GSTIN Register</span>
                <span className="text-slate-800 uppercase flex items-center gap-1">
                  <Clipboard className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> {seller.gstin || "NOT PROVIDED"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Business Phone</span>
                <span className="text-slate-800 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {seller.business_phone}
                </span>
              </div>
            </div>

            <div className="space-y-1 bg-slate-50 rounded-2xl border border-slate-100 p-3 text-[11px] font-semibold text-slate-500">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Registered Address</span>
              <p className="leading-relaxed text-slate-700">{seller.address}</p>
            </div>

            {/* Admin actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                onClick={() => handleApprove(seller.id, false)}
                variant="outline"
                className="border-rose-100 hover:bg-rose-50 text-rose-600 rounded-xl h-10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center p-0"
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Decline
              </Button>
              <Button
                onClick={() => handleApprove(seller.id, true)}
                className="bg-[#046A38] text-white hover:bg-[#046A38]/90 rounded-xl h-10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center p-0 shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" /> Authorize & Approve
              </Button>
            </div>

          </motion.div>
        ))}

        {sellers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-350">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">Clear queue</h4>
              <p className="text-[10px] text-slate-400 mt-1">There are no pending seller onboarding applications.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
