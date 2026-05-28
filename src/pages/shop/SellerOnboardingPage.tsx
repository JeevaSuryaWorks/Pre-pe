import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { shopService } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  ChevronLeft, Smartphone, Building, ShieldCheck, Clock,
  FileText, ArrowRight, Clipboard, Award, ShieldAlert, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SellerOnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Form states
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    const AUTHORIZED_ADMINS = [
      'connect.prepe@gmail.com',
      'prepeindia@outlook.com',
      'prepeindia@zohomail.in',
      'jeevasuriya2007@gmail.com'
    ];
    const isAdmin = AUTHORIZED_ADMINS.includes(user?.email || '');

    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Seller portal is restricted to authorized administrators.",
        variant: "destructive"
      });
      navigate("/shop");
      return;
    }

    checkProfile();
  }, [user, authLoading]);

  const checkProfile = async () => {
    setChecking(true);
    try {
      const data = await shopService.getSellerProfile();
      setProfile(data);
      if (data.exists && data.status === 'ACTIVE') {
        navigate('/seller/dashboard');
      }
    } catch (err) {
      console.error("Seller check failed:", err);
    } finally {
      setChecking(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!companyName || !businessPhone || !address) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required merchant credentials.",
        variant: "destructive"
      });
      return;
    }

    if (gstin && gstin.length !== 15) {
      toast({
        title: "GSTIN Error",
        description: "Indian Goods & Services Tax Identification Number must be exactly 15 characters.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      await shopService.registerSeller({
        company_name: companyName,
        gstin: gstin || null,
        business_phone: businessPhone,
        address
      });

      toast({
        title: "Application Received 📋",
        description: "Onboarding form submitted. Pre-pe administrative KYC verification is in progress."
      });

      checkProfile();
    } catch (err: any) {
      toast({
        title: "Onboarding Failed",
        description: err.message || "Failed to submit merchant onboarding.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (checking || authLoading) {
    return (
      <Layout showBottomNav={true} hideHeader={true}>
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Accessing Payout Ledgers...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={true} hideHeader={true}>
      <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-x-hidden">
        
        {/* Navy Gradient Background */}
        <div className="absolute top-0 left-0 w-full h-[220px] bg-gradient-to-b from-[#000080]/5 to-transparent pointer-events-none" />

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/shop')} className="p-1 hover:bg-slate-100 rounded-full transition-all">
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-lg font-black text-[#000080] tracking-tight">Merchant Onboarding</h1>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#046A38]">Partner Portal</p>
            </div>
          </div>
        </header>

        <div className="px-5 mt-6 space-y-6">
          {profile?.exists && profile.kyc_status === 'PENDING' ? (
            /* Pending status state card */
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 text-center space-y-6 shadow-sm py-12">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto shadow-sm relative">
                <div className="absolute inset-0 bg-amber-500/5 blur-xl rounded-full" />
                <Clock className="w-10 h-10 relative z-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Verification In Progress</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[240px] mx-auto">
                  Your merchant application for <strong>{profile.company_name}</strong> has been received successfully. Pre-pe Compliance desks are verifying your credentials.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                KYC STATUS: PENDING AUDIT
              </div>
              <Button onClick={() => navigate('/shop')} className="bg-slate-950 text-white rounded-2xl h-12 px-8 text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-800">
                Back to Shop
              </Button>
            </div>
          ) : (
            /* Registration onboarding form */
            <div className="space-y-6">
              <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-[#FF671F]/10 border border-[#FF671F]/20 text-[#FF671F] rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#000080] uppercase tracking-wider">Start Selling Gear</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Onboard your accessories inventory in under 5 minutes.</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleRegister} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm space-y-4 text-xs font-bold">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Company/Store Registered Name *</label>
                  <Input
                    placeholder="e.g. Rajat Mobiles & Gears"
                    className="bg-slate-50 border-none rounded-2xl h-11 pl-4 font-bold"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">GSTIN Number (Goods & Services Tax) (Optional)</label>
                  <Input
                    placeholder="e.g. 07AAAAA1111A1Z1"
                    maxLength={15}
                    className="bg-slate-50 border-none rounded-2xl h-11 pl-4 font-bold uppercase"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Business Phone Contact *</label>
                  <Input
                    placeholder="e.g. +91 99999 99999"
                    type="tel"
                    className="bg-slate-50 border-none rounded-2xl h-11 pl-4 font-bold"
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Corporate/Business Address *</label>
                  <textarea
                    placeholder="Complete address including warehouse details..."
                    className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF671F]/10 min-h-[90px]"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#FF671F] hover:bg-[#FF671F]/90 text-white rounded-2xl h-14 text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-between px-6"
                >
                  <span>Submit Partner Request</span>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </form>

              {/* Guarantees seal */}
              <div className="bg-[#FF671F]/5 border border-[#FF671F]/10 rounded-[2rem] p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-[#FF671F] shadow-sm shrink-0 border border-slate-50">
                  <Clipboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">KYC Compliance Check</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">We verify GSTIN registers. Please ensure your legal corporate data matches your submissions.</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}
