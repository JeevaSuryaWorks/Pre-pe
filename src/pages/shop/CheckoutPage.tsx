import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { shopService, AddressItem, CartItem } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, MapPin, Plus, Truck, ArrowRight, ShieldCheck,
  CreditCard, Loader2, Sparkles, Building, User, Phone, CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const couponCode = location.state?.couponCode as string | undefined;

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<AddressItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  // Address creation form state
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [isDefaultAddress, setIsDefaultAddress] = useState(false);
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Calculations States
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const cart = await shopService.getCart();
      setCartItems(cart);
      if (cart.length === 0) {
        navigate('/shop');
        return;
      }

      const adds = await shopService.getAddresses();
      setAddresses(adds);
      if (adds.length > 0) {
        setSelectedAddress(adds[0]);
      }

      // If a coupon code was passed, resolve the discount amount
      if (couponCode) {
        const subtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
        try {
          const couponRes = await shopService.verifyCoupon(couponCode, subtotal);
          setAppliedDiscount(couponRes.discount);
        } catch {
          setAppliedDiscount(0);
        }
      }
    } catch (err) {
      console.error("Checkout data fetch failed:", err);
      toast({
        title: "Database Error",
        description: "Failed to initialize checkout information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingAddress) return;
    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required delivery fields.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingAddress(true);
    try {
      const newAddress = await shopService.createAddress({
        full_name: fullName,
        phone,
        street,
        landmark: landmark || null,
        city,
        state,
        postal_code: postalCode,
        is_default: isDefaultAddress
      });

      toast({
        title: "Address Saved 🏠",
        description: "Successfully added new shipping address to your book."
      });

      // Reset address form
      setFullName("");
      setPhone("");
      setStreet("");
      setLandmark("");
      setCity("");
      setState("");
      setPostalCode("");
      setIsDefaultAddress(false);
      setShowAddAddress(false);

      // Re-query addresses
      const adds = await shopService.getAddresses();
      setAddresses(adds);
      setSelectedAddress(newAddress);
    } catch (err: any) {
      toast({
        title: "Address Error",
        description: err.message || "Failed to create shipping address.",
        variant: "destructive"
      });
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handlePaymentCheckout = async () => {
    if (!selectedAddress) {
      toast({
        title: "Delivery Missing",
        description: "Please select or add a shipping address first.",
        variant: "destructive"
      });
      return;
    }

    setCheckingOut(true);
    try {
      // 1. Create order on backend (initiates Razorpay order ID)
      const orderRes = await shopService.createOrder(selectedAddress.id, couponCode);
      
      const { orderId, razorpayOrderId, amount, key } = orderRes;

      // 2. Build options configuration for Razorpay Standard SDK
      const options = {
        key: key,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "PrePe E-Store",
        description: `Accessories Checkout #${orderId.substring(0, 5)}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          // 3. Cryptographically verify signature upon successful client payment
          try {
            setCheckingOut(true);
            await shopService.verifyOrderPayment(orderId, {
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            toast({
              title: "Order Placed! 🎉",
              description: "Your payment was captured and order is now being processed."
            });
            
            navigate('/orders');
          } catch (verifyErr: any) {
            toast({
              title: "Payment Verification Failed",
              description: verifyErr.message || "Failed to verify payment signatures.",
              variant: "destructive"
            });
          } finally {
            setCheckingOut(false);
          }
        },
        prefill: {
          name: selectedAddress.full_name,
          contact: selectedAddress.phone
        },
        theme: {
          color: "#000080" // Navy Brand color
        },
        modal: {
          ondismiss: () => {
            setCheckingOut(false);
            toast({
              title: "Checkout Dismissed",
              description: "Payment checkout modal was closed. Order remains PENDING."
            });
          }
        }
      };

      // Check if Razorpay SDK is globally initialized in browser window
      const rzpWindow = (window as any).Razorpay;
      if (rzpWindow) {
        const rzObject = new rzpWindow(options);
        rzObject.open();
      } else {
        // High fidelity sandbox verification fallback for developer emulators
        this?.logger?.warn || console.warn("Razorpay SDK not loaded in browser context, activating UAT signature fallback emulator.");
        
        toast({
          title: "Emulator Fallback",
          description: "Razorpay SDK not found. Simulating UAT payment capture...",
        });

        setTimeout(async () => {
          try {
            await shopService.verifyOrderPayment(orderId, {
              razorpay_order_id: razorpayOrderId,
              razorpay_payment_id: `pay_emu_${Date.now()}`,
              razorpay_signature: `sig_emu_${Date.now()}`
            });

            toast({
              title: "Order Confirmed! 🎉",
              description: "Payment captured successfully via sandbox emulation."
            });
            navigate('/orders');
          } catch (e: any) {
            toast({
              title: "UAT capture failed",
              description: e.message || "Payment verification failed",
              variant: "destructive"
            });
          } finally {
            setCheckingOut(false);
          }
        }, 1500);
      }
    } catch (err: any) {
      toast({
        title: "Checkout Initiation Failed",
        description: err.message || "Failed to build checkout parameters.",
        variant: "destructive"
      });
      setCheckingOut(false);
    }
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
  const taxableAmount = Math.max(0, subtotal - appliedDiscount);
  const tax = Math.round(taxableAmount * 0.18 * 100) / 100;
  const shipping = taxableAmount >= 500 ? 0 : 50;
  const grandTotal = Math.round((taxableAmount + tax + shipping) * 100) / 100;

  if (loading) {
    return (
      <Layout showBottomNav={true} hideHeader={true}>
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#000080]" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Opening Checkout Portal...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={true} hideHeader={true}>
      <div className="min-h-screen bg-[#F8FAFC] pb-32 relative overflow-x-hidden">
        
        {/* Saffron accent */}
        <div className="absolute top-0 left-0 w-full h-[180px] bg-gradient-to-b from-[#FF671F]/5 to-transparent pointer-events-none" />

        {/* Navigation header */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 flex items-center justify-between shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.2em]">Secure Checkout</h2>
          <div className="w-10 h-10 flex items-center justify-center text-[#046A38]">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="px-5 mt-6 space-y-6">
          
          {/* Address selection cards */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#FF671F]" /> Shipping Address
              </h4>
              {!showAddAddress && (
                <button
                  onClick={() => setShowAddAddress(true)}
                  className="text-[10px] font-black uppercase text-[#FF671F] tracking-wider flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New
                </button>
              )}
            </div>

            {/* Form to add address inside checkout */}
            <AnimatePresence>
              {showAddAddress && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleAddAddress}
                  className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-lg space-y-3.5"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                    <h5 className="text-[10px] font-black uppercase text-slate-800 tracking-wider">New Shipping Profile</h5>
                    <button type="button" onClick={() => setShowAddAddress(false)} className="text-[10px] font-black text-rose-500 uppercase">
                      Cancel
                    </button>
                  </div>
                  
                  <div className="space-y-3 text-xs font-bold">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Receiver Full Name"
                        className="bg-slate-50 border-none rounded-xl h-10 pl-10 font-bold"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Contact Phone"
                        type="tel"
                        className="bg-slate-50 border-none rounded-xl h-10 pl-10 font-bold"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Flat/House, Street Address"
                        className="bg-slate-50 border-none rounded-xl h-10 pl-10 font-bold"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        required
                      />
                    </div>
                    <Input
                      placeholder="Landmark (Optional)"
                      className="bg-slate-50 border-none rounded-xl h-10 pl-4 font-bold"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="City"
                        className="bg-slate-50 border-none rounded-xl h-10 pl-4 font-bold"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                      <Input
                        placeholder="State"
                        className="bg-slate-50 border-none rounded-xl h-10 pl-4 font-bold"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        required
                      />
                    </div>
                    <Input
                      placeholder="Postal Pincode (6-digit)"
                      maxLength={6}
                      className="bg-slate-50 border-none rounded-xl h-10 pl-4 font-bold"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      required
                    />
                    <div className="flex items-center gap-2 px-1 pt-1.5 select-none">
                      <input
                        type="checkbox"
                        id="isDefault"
                        className="rounded accent-[#FF671F]"
                        checked={isDefaultAddress}
                        onChange={(e) => setIsDefaultAddress(e.target.checked)}
                      />
                      <label htmlFor="isDefault" className="text-[10px] uppercase font-black text-slate-400 tracking-wider cursor-pointer">
                        Set as default shipping address
                      </label>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={submittingAddress}
                    className="w-full bg-[#000080] hover:bg-[#000080]/90 text-white rounded-xl h-11 text-xs font-black uppercase tracking-widest"
                  >
                    {submittingAddress ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Delivery Profile"}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List existing addresses */}
            <div className="space-y-3">
              {addresses.map((add) => (
                <div
                  key={add.id}
                  onClick={() => setSelectedAddress(add)}
                  className={cn(
                    "bg-white border rounded-3xl p-4 cursor-pointer transition-all duration-350 shadow-sm flex items-start gap-4",
                    selectedAddress?.id === add.id
                      ? "border-[#000080] ring-2 ring-[#000080]/5 bg-indigo-50/5"
                      : "border-slate-100 hover:border-slate-350"
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full shrink-0 flex items-center justify-center text-xs shadow-sm",
                    selectedAddress?.id === add.id
                      ? "bg-[#000080] text-white"
                      : "bg-slate-50 text-slate-400"
                  )}>
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  
                  <div className="flex-1 min-w-0 text-xs font-bold text-slate-650 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-800 font-black">{add.full_name}</span>
                      {add.is_default && (
                        <span className="text-[8px] font-black uppercase tracking-widest text-[#046A38] bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-2 leading-relaxed text-slate-500">{add.street}, {add.landmark ? `${add.landmark}, ` : ""}{add.city}, {add.state} - {add.postal_code}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone: {add.phone}</p>
                  </div>
                </div>
              ))}

              {addresses.length === 0 && !showAddAddress && (
                <p className="text-center text-xs text-slate-400 py-6">No shipping address found. Please add an address to continue checkout.</p>
              )}
            </div>
          </div>

          {/* Checkout Items Summary list */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em] px-1 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#000080]" /> Order Summary
            </h4>
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm divide-y divide-slate-50">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 gap-4 text-xs font-bold">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-slate-800 line-clamp-1">{item.product.title}</h5>
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      Qty: {item.quantity} {item.variant ? `• ${item.variant.name}` : ""}
                    </span>
                  </div>
                  <span className="text-slate-900 shrink-0">₹{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing calculations card */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3 text-xs font-semibold text-slate-500">
            <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em] pb-1 border-b border-slate-50">Grand Billing</h4>
            <div className="flex justify-between items-center">
              <span>Items Total</span>
              <span className="text-slate-800">₹{subtotal.toFixed(2)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between items-center text-emerald-600">
                <span>Coupon Applied ({couponCode})</span>
                <span>-₹{appliedDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span>GST/Tax (18% Standard)</span>
              <span className="text-slate-800">₹{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Shipping Fee</span>
              <span className="text-slate-800">{shipping > 0 ? `₹${shipping.toFixed(2)}` : "FREE"}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-sm font-black">
              <span className="text-[#000080]">Total Bill</span>
              <span className="text-lg text-[#000080]">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

        </div>

        {/* Dynamic Action Sticky Footer */}
        {selectedAddress && (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 p-4 px-6 flex justify-center shadow-2xl">
            <Button
              onClick={handlePaymentCheckout}
              disabled={checkingOut}
              className="w-full max-w-md bg-[#FF671F] hover:bg-[#FF671F]/90 text-white rounded-2xl h-14 text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-between px-6"
            >
              <span>{checkingOut ? "Verifying Transaction..." : "Proceed to Payment"}</span>
              <span className="flex items-center gap-1.5">
                {checkingOut ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <>₹{grandTotal.toFixed(2)} <CreditCard className="w-4 h-4" /></>}
              </span>
            </Button>
          </div>
        )}

      </div>
    </Layout>
  );
}
