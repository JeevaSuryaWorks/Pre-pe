import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { shopService } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ShoppingBag, DollarSign, Package, TrendingUp, Truck,
  Plus, ArrowUpRight, HelpCircle, User, Award, CheckCircle2,
  Clock, AlertCircle, Loader2, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SellerDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Withdrawal States
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [showWithdrawDrawer, setShowWithdrawDrawer] = useState(false);

  // Shipping updates states
  const [shippingOrderId, setShippingOrderId] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [updatingShipment, setUpdatingShipment] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Confirm seller profile exists and is active
      const profile = await shopService.getSellerProfile();
      if (!profile.exists || profile.status !== 'ACTIVE') {
        navigate('/seller/onboarding');
        return;
      }

      const data = await shopService.getSellerDashboard();
      setMetrics(data);

      const ords = await shopService.getSellerOrders();
      setOrders(ords);

      const draws = await shopService.getWithdrawalHistory();
      setWithdrawals(draws);
    } catch (err) {
      console.error("Seller dashboard load failed:", err);
      toast({
        title: "Database Error",
        description: "Failed to load merchant records.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingWithdrawal || !withdrawAmount) return;
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid payout amount.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingWithdrawal(true);
    try {
      await shopService.requestWithdrawal(amount);
      toast({
        title: "Payout Requested 💸",
        description: `Successfully requested withdrawal of ₹${amount.toFixed(2)}.`
      });
      setWithdrawAmount("");
      setShowWithdrawDrawer(false);
      loadDashboard();
    } catch (err: any) {
      toast({
        title: "Payout Failed",
        description: err.message || "Failed to process withdrawal payout.",
        variant: "destructive"
      });
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const handleShipmentDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updatingShipment || !shippingOrderId) return;
    setUpdatingShipment(true);
    try {
      // Mark as SHIPPED
      await shopService.updateShipment(shippingOrderId, "SHIPPED");
      
      toast({
        title: "Shipment Dispatched 📦",
        description: "Order status transitioned to SHIPPED successfully."
      });
      
      setTrackingId("");
      setShippingOrderId(null);
      loadDashboard();
    } catch (err: any) {
      toast({
        title: "Shipment Failed",
        description: err.message || "Failed to update shipment status.",
        variant: "destructive"
      });
    } finally {
      setUpdatingShipment(false);
    }
  };

  const getWithdrawalStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 border-amber-100 text-amber-600';
      case 'APPROVED':
        return 'bg-emerald-50 border-emerald-100 text-emerald-600';
      case 'REJECTED':
        return 'bg-rose-50 border-rose-100 text-rose-600';
      default:
        return 'bg-slate-50 border-slate-100 text-slate-500';
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={true} hideHeader={true}>
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Opening Payout Portal...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={true} hideHeader={true}>
      <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-x-hidden">
        
        {/* Flag theme Green accent top */}
        <div className="absolute top-0 left-0 w-full h-[220px] bg-gradient-to-b from-[#046A38]/10 to-transparent pointer-events-none" />

        {/* Header */}
        <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/shop')} className="p-1 hover:bg-slate-100 rounded-full transition-all">
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
            <div>
              <h1 className="text-lg font-black text-[#000080] tracking-tight">Merchant Portal</h1>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#FF671F]">Business Dashboard</p>
            </div>
          </div>
          <Link to="/seller/inventory" className="h-10 px-4 rounded-xl bg-[#000080] text-white flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider shadow-md">
            <Plus className="w-3.5 h-3.5" /> Products Catalog
          </Link>
        </header>

        {/* Sales Aggregates grid */}
        <div className="px-5 mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-indigo-50/50 to-transparent" />
            <div className="h-8 w-8 rounded-xl bg-[#000080]/5 text-[#000080] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Gross Sales</p>
            <h3 className="text-lg font-black text-[#000080]">₹{metrics?.grossSales?.toFixed(2) || "0.00"}</h3>
          </div>

          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-2 relative overflow-hidden">
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-emerald-50/50 to-transparent" />
            <div className="h-8 w-8 rounded-xl bg-[#046A38]/5 text-[#046A38] flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Net Earnings</p>
            <h3 className="text-lg font-black text-[#046A38]">₹{metrics?.netEarnings?.toFixed(2) || "0.00"}</h3>
          </div>
        </div>

        {/* Dashboard Quick Stats Info list */}
        <div className="px-5 mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "Orders Sold", value: metrics?.totalOrders || 0, icon: ShoppingBag, color: "text-[#000080]" },
            { label: "Products Listed", value: metrics?.totalProductsListed || 0, icon: Package, color: "text-[#FF671F]" },
            { label: "Platform Fee", value: `${metrics?.commissionFee || 10}%`, icon: Award, color: "text-[#046A38]" }
          ].map((stat, i) => (
            <div key={i} className="bg-white border border-slate-50 rounded-2xl p-3.5 text-center shadow-sm space-y-1">
              <stat.icon className={cn("w-4 h-4 mx-auto", stat.color)} />
              <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider leading-none">{stat.label}</p>
              <h4 className="text-xs font-black text-slate-800 leading-none pt-0.5">{stat.value}</h4>
            </div>
          ))}
        </div>

        {/* Withdraw cash option drawer */}
        <div className="px-5 mt-6">
          <div className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-[#046A38]" /> Earning Withdrawals
              </h4>
              <button
                onClick={() => setShowWithdrawDrawer(!showWithdrawDrawer)}
                className="text-[9px] font-black uppercase tracking-wider text-[#FF671F] flex items-center gap-0.5"
              >
                Withdraw Request <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <AnimatePresence>
              {showWithdrawDrawer && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleWithdrawal}
                  className="space-y-3.5 overflow-hidden text-xs font-bold"
                >
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Payout Amount (₹)</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. 500"
                      type="number"
                      className="bg-slate-50 border-none rounded-xl h-11 text-xs font-black"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                    />
                    <Button
                      type="submit"
                      disabled={submittingWithdrawal}
                      className="bg-[#046A38] text-white hover:bg-[#046A38]/90 rounded-xl h-11 px-5 text-xs font-black uppercase shrink-0 shadow-sm"
                    >
                      {submittingWithdrawal ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request"}
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Payouts requests list */}
            <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 text-xs font-semibold">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-none">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 font-bold">₹{Number(w.amount).toFixed(2)}</span>
                    <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(w.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <span className={cn("px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest", getWithdrawalStatusBadge(w.status))}>
                    {w.status}
                  </span>
                </div>
              ))}
              {withdrawals.length === 0 && (
                <p className="text-center text-[10px] text-slate-400 py-3">No withdrawal history available.</p>
              )}
            </div>
          </div>
        </div>

        {/* Seller orders awaiting dispatch */}
        <main className="px-5 mt-6 space-y-4">
          <div className="flex justify-between items-center mb-1 px-1">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.2em]">Fulfillment Orders</h3>
            <p className="text-[10px] font-bold text-slate-500">{orders.length} processing items</p>
          </div>

          {/* Tracking ID submission drawer */}
          <AnimatePresence>
            {shippingOrderId && (
              <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onSubmit={handleShipmentDispatch}
                className="bg-slate-900 border border-slate-800 text-white rounded-[2rem] p-5 shadow-2xl space-y-4 text-xs font-bold relative z-25"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" /> Dispatch Shipment
                  </h5>
                  <button type="button" onClick={() => setShippingOrderId(null)} className="text-[10px] uppercase font-black text-rose-400">
                    Cancel
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Delhivery/DTDC Tracking ID *</label>
                  <Input
                    placeholder="e.g. DEL123456789"
                    className="bg-slate-800 border-none text-white rounded-xl h-10 pl-4 font-bold"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updatingShipment}
                  className="w-full bg-[#046A38] text-white hover:bg-[#046A38]/90 rounded-xl h-11 text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center p-0"
                >
                  {updatingShipment ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Dispatch"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List orders */}
          <div className="space-y-4">
            {orders.map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4 transition-all">
                {/* Header status */}
                <div className="flex justify-between items-start pb-3 border-b border-slate-50">
                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Order ID</span>
                    <span className="text-xs font-black text-[#000080] uppercase">#{item.order_id.substring(0, 8)}</span>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-wider",
                    item.order.status === 'SHIPPED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-indigo-50 text-indigo-600 border-indigo-100"
                  )}>
                    {item.order.status}
                  </span>
                </div>

                {/* Product specifics */}
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-50 flex items-center justify-center p-1 shrink-0">
                    <img src={item.product.images?.[0]} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs font-bold">
                    <h5 className="text-slate-800 line-clamp-1 leading-tight">{item.product.title}</h5>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1 block">
                      Qty: {item.quantity} {item.variant ? `• ${item.variant.name}` : ""}
                    </span>
                  </div>
                </div>

                {/* Delivery street info */}
                <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50 text-[10px] font-semibold text-slate-500 space-y-1">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Delivery To</span>
                  <p className="line-clamp-2 leading-relaxed text-slate-700">{item.order.address.street}, {item.order.address.city} - {item.order.address.postal_code}</p>
                  <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Phone: {item.order.address.phone}</p>
                </div>

                {/* Dispatch Trigger action */}
                {item.order.status !== 'SHIPPED' && item.order.status !== 'DELIVERED' && (
                  <Button
                    onClick={() => setShippingOrderId(item.order_id)}
                    className="w-full bg-[#FF671F] hover:bg-[#FF671F]/90 text-white rounded-xl h-11 text-[9px] font-black uppercase tracking-widest flex items-center justify-center shadow-md shadow-orange-500/10 active:scale-95 transition-all p-0"
                  >
                    <Truck className="w-4 h-4 mr-1.5" /> Dispatch Item
                  </Button>
                )}
              </div>
            ))}
            
            {orders.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-12">No orders awaiting fulfillment.</p>
            )}
          </div>
        </main>

      </div>
    </Layout>
  );
}
