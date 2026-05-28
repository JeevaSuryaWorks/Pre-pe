import { useState, useEffect } from "react";
import { shopService } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp, CreditCard, Clock, Truck, ShieldAlert, Award,
  RotateCcw, ShieldCheck, AlertCircle, Loader2, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminOrders() {
  const { toast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Refund states
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [processingRefund, setProcessingRefund] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      // Query customer orders list (reusing general getters or listings)
      const data = await shopService.getOrders();
      setOrders(data);
    } catch (err) {
      console.error("Admin orders load failed:", err);
      toast({
        title: "Database Error",
        description: "Failed to query system orders log.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processingRefund || !refundOrderId) return;
    const amount = Number(refundAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid refund amount.",
        variant: "destructive"
      });
      return;
    }

    setProcessingRefund(true);
    try {
      await shopService.refundOrder(refundOrderId, amount, refundReason);
      toast({
        title: "Refund Processed 💸",
        description: `Successfully processed refund of ₹${amount.toFixed(2)}.`
      });
      setRefundOrderId(null);
      setRefundAmount("");
      setRefundReason("");
      loadOrders();
    } catch (err: any) {
      toast({
        title: "Refund Failed",
        description: err.message || "Failed to execute payment gateway refund.",
        variant: "destructive"
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 border-amber-100 text-amber-600';
      case 'PAID':
        return 'bg-indigo-50 border-indigo-100 text-indigo-600';
      case 'SHIPPED':
        return 'bg-emerald-50 border-emerald-100 text-emerald-600';
      case 'DELIVERED':
        return 'bg-emerald-600 text-white border-emerald-700';
      case 'CANCELLED':
        return 'bg-rose-50 border-rose-100 text-rose-600';
      default:
        return 'bg-slate-50 border-slate-100 text-slate-500';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gathering Orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Overview Header */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#046A38] shadow-sm">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-[#000080] uppercase tracking-wider">E-Commerce Orders Tracking</h2>
          <p className="text-xs text-slate-400 font-medium">Monitor customer order lifecycle and process payment gateway refunds.</p>
        </div>
      </div>

      {/* Refund processing form drawer */}
      <AnimatePresence>
        {refundOrderId && (
          <motion.form
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onSubmit={handleRefund}
            className="bg-slate-900 border border-slate-800 text-white rounded-[2.5rem] p-5 shadow-2xl space-y-4 text-xs font-bold relative z-[70]"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Process Payment Refund
              </h5>
              <button type="button" onClick={() => setRefundOrderId(null)} className="text-[10px] uppercase font-black text-rose-400">
                Cancel
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Refund Amount (₹) *</label>
                <Input
                  placeholder="e.g. 299"
                  type="number"
                  className="bg-slate-800 border-none text-white rounded-xl h-10 pl-4 font-bold"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Refund Reason *</label>
                <Input
                  placeholder="e.g. Customer returned clear cover"
                  className="bg-slate-800 border-none text-white rounded-xl h-10 pl-4 font-bold"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={processingRefund}
              className="w-full bg-[#046A38] text-white hover:bg-[#046A38]/90 rounded-xl h-11 text-xs font-black uppercase tracking-widest shadow-md flex items-center justify-center p-0"
            >
              {processingRefund ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Gateway Refund"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4 transition-all hover:shadow-md"
          >
            {/* Header info */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-50">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Order ID</span>
                <span className="text-xs font-black text-[#000080] uppercase">#{order.id.substring(0, 8)}</span>
              </div>
              <span className={cn("px-2.5 py-1.5 rounded-full border text-[8px] font-black uppercase tracking-wider", getStatusBadge(order.status))}>
                {order.status}
              </span>
            </div>

            {/* Line items detail */}
            <div className="space-y-2">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs font-bold text-slate-650">
                  <span>{item.product.title} {item.variant ? `(${item.variant.name})` : ""}</span>
                  <span className="text-slate-800">Qty: {item.quantity} • ₹{item.unit_price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Address information */}
            <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50 text-[10px] font-semibold text-slate-500">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Shipping To</span>
              <p className="line-clamp-2 leading-relaxed text-slate-700">{order.address.street}, {order.address.city} - {order.address.postal_code}</p>
            </div>

            {/* Price Footer */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-xs font-semibold text-slate-400">
              <span>Customer ID: #{order.user_id.substring(0, 8).toUpperCase()}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-widest">Total Bill</span>
                <span className="text-sm font-black text-[#000080]">₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Refund Trigger button */}
            {order.status !== 'CANCELLED' && order.status !== 'PENDING' && (
              <Button
                onClick={() => {
                  setRefundOrderId(order.id);
                  setRefundAmount(order.total_amount.toString());
                }}
                className="w-full bg-rose-600 text-white hover:bg-rose-700 rounded-xl h-11 text-[9px] font-black uppercase tracking-widest flex items-center justify-center p-0 shadow-md shadow-rose-500/10 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Process Order Refund
              </Button>
            )}
          </motion.div>
        ))}

        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-350">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">No checkout history</h4>
              <p className="text-[10px] text-slate-400 mt-1">There are no accessories orders placed on the platform.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
