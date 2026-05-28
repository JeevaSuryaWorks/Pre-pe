import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { shopService, CartItem } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ShoppingCart, Trash2, Plus, Minus, ArrowRight,
  Sparkles, Ticket, Percent, ShieldCheck
} from "lucide-react";
import { PrePeSpinner } from "@/components/ui/BrandLoader";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CartPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    try {
      const data = await shopService.getCart();
      setCartItems(data);
      // Recalculate coupon if one was already active
      if (appliedCoupon) {
        const subtotal = data.reduce((acc, curr) => acc + curr.subtotal, 0);
        try {
          const res = await shopService.verifyCoupon(appliedCoupon.code, subtotal);
          setAppliedCoupon({ code: res.code, discount: res.discount });
        } catch {
          setAppliedCoupon(null);
        }
      }
    } catch (err) {
      console.error("Cart retrieval failed:", err);
      toast({
        title: "Cart Error",
        description: "Failed to load your shopping bag.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (item: CartItem, newQty: number) => {
    if (newQty <= 0) {
      handleRemove(item.id);
      return;
    }
    const maxStock = item.variant?.stock || item.product.totalStock;
    if (newQty > maxStock) {
      toast({
        title: "Limit Reached",
        description: `Only ${maxStock} units are available in stock.`,
        variant: "destructive"
      });
      return;
    }

    try {
      await shopService.updateCart(item.id, newQty);
      // Soft updates
      setCartItems(prev => prev.map(c => c.id === item.id ? { ...c, quantity: newQty, subtotal: c.unitPrice * newQty } : c));
    } catch (err: any) {
      toast({
        title: "Quantity Error",
        description: err.message || "Failed to update item count.",
        variant: "destructive"
      });
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await shopService.removeFromCart(itemId);
      toast({
        title: "Removed",
        description: "Accessory successfully removed from your bag."
      });
      setCartItems(prev => prev.filter(c => c.id !== itemId));
    } catch (err: any) {
      toast({
        title: "Removal Error",
        description: err.message || "Failed to delete cart item.",
        variant: "destructive"
      });
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCheckingCoupon(true);
    const subtotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    try {
      const res = await shopService.verifyCoupon(couponCode, subtotal);
      setAppliedCoupon({ code: res.code, discount: res.discount });
      toast({
        title: "Coupon Applied 🎫",
        description: `Discount of ₹${res.discount.toFixed(2)} applied successfully.`
      });
    } catch (err: any) {
      toast({
        title: "Invalid Coupon",
        description: err.message || "Coupon code could not be applied.",
        variant: "destructive"
      });
      setAppliedCoupon(null);
    } finally {
      setCheckingCoupon(false);
    }
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const discount = appliedCoupon ? appliedCoupon.discount : 0;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.18 * 100) / 100; // 18% GST standard
  const shipping = taxableAmount >= 500 || taxableAmount === 0 ? 0 : 50; // free shipping over ₹500
  const grandTotal = Math.round((taxableAmount + tax + shipping) * 100) / 100;

  if (loading) {
    return (
      <Layout showBottomNav={true} hideHeader={true}>
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
          <PrePeSpinner className="w-12 h-12" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Opening Shopping Bag...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={true} hideHeader={true}>
      <div className="min-h-screen bg-[#F8FAFC] pb-40 relative overflow-x-hidden">
        
        {/* Navy Gradient Top */}
        <div className="absolute top-0 left-0 w-full h-[180px] bg-gradient-to-b from-[#000080]/5 to-transparent pointer-events-none" />

        {/* Header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 flex items-center justify-between shadow-sm">
          <button onClick={() => navigate('/shop')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.2em]">Shopping Bag</h2>
          <div className="w-10 h-10 flex items-center justify-center text-slate-400">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>

        {/* Cart Listing */}
        <div className="px-5 mt-6 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-6">
              <div className="h-20 w-20 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingCart className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">Your bag is empty</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Browse our latest mobile accessories to add items here.</p>
              </div>
              <Button onClick={() => navigate('/shop')} className="bg-[#FF671F] hover:bg-[#FF671F]/90 text-white rounded-2xl h-12 px-8 text-xs font-black uppercase tracking-widest shadow-md">
                Start Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {cartItems.map((item) => (
                  <motion.div
                    key={item.id}
                    exit={{ opacity: 0, x: -50 }}
                    className="bg-white border border-slate-100 rounded-3xl p-4 shadow-sm flex gap-4 relative overflow-hidden group transition-all"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-center p-2 shrink-0">
                      <img
                        src={item.product.images?.[0] || "https://placehold.co/100x100/png?text=Gear"}
                        alt={item.product.title}
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </div>

                    {/* Details Column */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{item.product.title}</h4>
                          <button onClick={() => handleRemove(item.id)} className="text-slate-300 hover:text-rose-500 p-0.5 active:scale-90 transition-all shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {item.variant && (
                          <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-md">
                            {item.variant.name}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controller & Price */}
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            className="h-5 w-5 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all shadow-sm"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-black text-slate-800 min-w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="h-5 w-5 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all shadow-sm"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        <span className="text-xs font-black text-[#000080]">₹{item.subtotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Promo Coupon Application Drawer */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em] flex items-center gap-1.5">
                  <Ticket className="w-4 h-4 text-[#FF671F]" /> Promo Coupon
                </h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Coupon (e.g. ACC10)"
                    className="bg-slate-50 border-none rounded-2xl h-11 text-xs font-bold pl-4 focus-visible:ring-[#FF671F]/20 uppercase"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button
                    onClick={handleApplyCoupon}
                    disabled={checkingCoupon}
                    className="bg-[#000080] hover:bg-[#000080]/90 text-white rounded-2xl h-11 px-5 text-xs font-black uppercase tracking-widest shrink-0 shadow-sm"
                  >
                    {checkingCoupon ? <PrePeSpinner className="w-4 h-4" /> : "Apply"}
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-emerald-700 text-xs font-bold flex justify-between items-center shadow-sm">
                    <span className="flex items-center gap-1"><Percent className="w-3.5 h-3.5" /> Code <strong>{appliedCoupon.code}</strong> Applied!</span>
                    <button onClick={() => setAppliedCoupon(null)} className="text-[10px] uppercase font-black text-rose-500">Remove</button>
                  </div>
                )}
              </div>

              {/* Price computation summary card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 text-xs font-semibold text-slate-500">
                <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em] pb-1 border-b border-slate-50">Billing Summary</h4>
                <div className="flex justify-between items-center">
                  <span>Bag Subtotal</span>
                  <span className="text-slate-800">₹{subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600">
                    <span>Coupon Discount</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>GST/Tax (18% Standard)</span>
                  <span className="text-slate-800">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Shipping/Delivery</span>
                  <span className="text-slate-800">{shipping > 0 ? `₹${shipping.toFixed(2)}` : "FREE"}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-sm font-black text-slate-850">
                  <span className="text-[#000080]">Grand Total</span>
                  <span className="text-lg text-[#000080]">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Quality Standards Guarantee banner */}
              <div className="flex items-center gap-2.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-2xl text-[9px] font-black text-slate-400 uppercase tracking-widest justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Secure Payments & Quick Fulfillment Guaranteed
              </div>
            </div>
          )}
        </div>

        {/* Persistent Action Sticky Footer — ABOVE 64px BottomNav */}
        {cartItems.length > 0 && (
          <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center px-4">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl p-3 shadow-2xl">
              <Button
                onClick={() => navigate('/checkout', { state: { couponCode: appliedCoupon?.code } })}
                className="w-full bg-[#FF671F] hover:bg-[#FF671F]/90 text-white rounded-xl h-14 text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-between px-6"
              >
                <span>Verify & Checkout</span>
                <span className="flex items-center gap-1.5">₹{grandTotal.toFixed(2)} <ArrowRight className="w-4 h-4" /></span>
              </Button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
