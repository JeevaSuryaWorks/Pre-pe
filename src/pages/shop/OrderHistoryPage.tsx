import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { shopService, OrderSummary } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, Package, Clock, ShieldCheck, CheckCircle2,
  Calendar, MapPin, Truck, AlertCircle, FileText, ExternalLink, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await shopService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Orders load failed:", err);
      toast({
        title: "Database Error",
        description: "Failed to query order history.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (order: OrderSummary) => {
    toast({
      title: "Invoice Generated 📄",
      description: `Invoice for Order #${order.id.substring(0, 8).toUpperCase()} downloaded successfully.`
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending Payment', bg: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock };
      case 'PAID':
        return { label: 'Paid & Processing', bg: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: ShieldCheck };
      case 'PROCESSING':
        return { label: 'Processing', bg: 'bg-blue-50 text-blue-600 border-blue-100', icon: Package };
      case 'SHIPPED':
        return { label: 'Shipped Out', bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Truck };
      case 'DELIVERED':
        return { label: 'Delivered', bg: 'bg-emerald-600 text-white border-emerald-700', icon: CheckCircle2 };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: 'bg-rose-50 text-rose-600 border-rose-100', icon: AlertCircle };
      default:
        return { label: status, bg: 'bg-slate-50 text-slate-500 border-slate-100', icon: AlertCircle };
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (selectedFilter === 'ALL') return true;
    return order.status === selectedFilter;
  });

  if (loading) {
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
        
        {/* Navy Accents */}
        <div className="absolute top-0 left-0 w-full h-[180px] bg-gradient-to-b from-[#000080]/5 to-transparent pointer-events-none" />

        {/* Navigation header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 flex items-center justify-between shadow-sm">
          <button onClick={() => navigate('/shop')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.2em]">Orders Tracking</h2>
          <div className="w-10 h-10 flex items-center justify-center text-slate-400">
            <Package className="w-4 h-4" />
          </div>
        </div>

        {/* Status Filters */}
        <div className="px-5 mt-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { key: "ALL", label: "All Orders" },
              { key: "PAID", label: "Paid" },
              { key: "SHIPPED", label: "Shipped" },
              { key: "DELIVERED", label: "Delivered" },
              { key: "CANCELLED", label: "Cancelled" }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={cn(
                  "px-4 py-2.5 rounded-2xl border text-[10px] uppercase font-black tracking-widest shrink-0 transition-all active:scale-95 shadow-sm",
                  selectedFilter === filter.key
                    ? "bg-[#000080] border-[#000080] text-white"
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List Container */}
        <main className="px-5 mt-6 space-y-5">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-350">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">No Orders Found</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">There are no orders listed matching this status.</p>
              </div>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const badge = getStatusBadge(order.status);
              const BadgeIcon = badge.icon;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4 relative overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Card Header Status */}
                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-slate-50">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Order ID
                      </span>
                      <h4 className="text-xs font-bold text-slate-850 uppercase">
                        #{order.id.substring(0, 8)}
                      </h4>
                    </div>
                    <div className={cn("px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5", badge.bg)}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Order Line Items */}
                  <div className="space-y-3.5">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-50 flex items-center justify-center p-1.5 shrink-0">
                          <img
                            src={item.product.images?.[0] || "https://placehold.co/100x100/png?text=Gear"}
                            alt={item.product.title}
                            className="w-full h-full object-contain mix-blend-multiply"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h5 className="text-xs font-bold text-slate-800 line-clamp-1">
                            {item.product.title}
                          </h5>
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mt-0.5">
                            Qty: {item.quantity} {item.variant ? `• ${item.variant.name}` : ""}
                          </span>
                        </div>
                        <span className="text-xs font-black text-slate-900 shrink-0 self-center">
                          ₹{(item.unit_price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Step Tracker Dispatch Indicators */}
                  {order.status !== 'CANCELLED' && (
                    <div className="py-2.5 bg-slate-50/50 rounded-2xl border border-slate-50 px-4 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-slate-400">
                      <div className={cn("flex items-center gap-1", order.status !== 'PENDING' ? "text-[#000080]" : "")}>
                        <CheckCircle2 className="w-3 h-3 text-[#046A38] shrink-0" /> Ordered
                      </div>
                      <div className="h-px bg-slate-200 flex-1 mx-3" />
                      <div className={cn("flex items-center gap-1", (order.status === 'SHIPPED' || order.status === 'DELIVERED') ? "text-[#000080]" : "")}>
                        {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && <CheckCircle2 className="w-3 h-3 text-[#046A38] shrink-0" />} Shipped
                      </div>
                      <div className="h-px bg-slate-200 flex-1 mx-3" />
                      <div className={cn("flex items-center gap-1", order.status === 'DELIVERED' ? "text-[#000080]" : "")}>
                        {order.status === 'DELIVERED' && <CheckCircle2 className="w-3 h-3 text-[#046A38] shrink-0" />} Delivered
                      </div>
                    </div>
                  )}

                  {/* Order Footer summary */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50 text-xs font-semibold text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(order.created_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider">Total paid</span>
                      <span className="text-sm font-black text-[#000080]">₹{order.total_amount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action triggers */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      onClick={() => handleDownloadInvoice(order)}
                      variant="outline"
                      className="border-slate-100 hover:bg-slate-50 text-slate-600 rounded-xl h-10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center p-0 shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" /> Invoice
                    </Button>
                    {order.status === 'SHIPPED' && (
                      <Button
                        onClick={() => window.open('https://www.delhivery.com/', '_blank')}
                        className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl h-10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center p-0 shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Track Delivery
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </main>

      </div>
    </Layout>
  );
}
