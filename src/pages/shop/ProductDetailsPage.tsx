import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { shopService, ProductItem, ProductVariant } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft, ShoppingCart, Star, Plus, Minus, ShieldCheck, Truck, RotateCcw,
  Sparkles, Heart, Share2, Award, Clock, ArrowRight, CornerDownRight, Check
} from "lucide-react";
import { PrePeSpinner } from "@/components/ui/BrandLoader";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [seller, setSeller] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // Active Image Gallery State
  const [activeImage, setActiveImage] = useState<string>("");

  // Delivery Estimate State
  const [pincode, setPincode] = useState("");
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{ eligible: boolean; days?: number; message?: string } | null>(null);

  // Submit Review State
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      loadProductDetails();
      loadCartCount();
    }
  }, [id]);

  const loadProductDetails = async () => {
    setLoading(true);
    try {
      const data = await shopService.getProduct(id!);
      setProduct(data);
      setReviews(data.reviews || []);
      setSeller(data.seller || null);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      }
      setActiveImage(data.images?.[0] || "https://placehold.co/500x500/png?text=Gear");
    } catch (err) {
      console.error("Product details fetch failed:", err);
      toast({
        title: "Product Missing",
        description: "Failed to retrieve this product. It may have been deactivated.",
        variant: "destructive"
      });
      navigate('/shop');
    } finally {
      setLoading(false);
    }
  };

  const loadCartCount = async () => {
    try {
      const cart = await shopService.getCart();
      setCartCount(cart.reduce((acc, curr) => acc + curr.quantity, 0));
    } catch (err) {
      console.error("Cart count failed:", err);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await shopService.addToCart(product.id, selectedVariant?.id || null, quantity);
      toast({
        title: "Added to Cart 🎉",
        description: `Successfully added ${quantity}x ${product.title} to your cart.`
      });
      loadCartCount();
    } catch (err: any) {
      toast({
        title: "Cart Error",
        description: err.message || "Failed to add product to cart.",
        variant: "destructive"
      });
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await shopService.addToCart(product.id, selectedVariant?.id || null, quantity);
      loadCartCount();
      navigate('/cart');
    } catch (err: any) {
      toast({
        title: "Checkout Error",
        description: err.message || "Failed to initiate buy now checkout.",
        variant: "destructive"
      });
    }
  };

  const handleCheckPincode = async () => {
    if (!pincode || pincode.length !== 6 || isNaN(Number(pincode))) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit Indian pincode.",
        variant: "destructive"
      });
      return;
    }

    setCheckingPincode(true);
    setDeliveryResult(null);

    // Simulate real shipping api checker
    setTimeout(() => {
      setCheckingPincode(false);
      const isEligible = pincode.startsWith("1") || pincode.startsWith("4") || pincode.startsWith("5") || pincode.startsWith("6") || pincode.startsWith("7") || pincode.startsWith("2");
      if (isEligible) {
        setDeliveryResult({
          eligible: true,
          days: pincode.startsWith("1") ? 2 : 3,
          message: "Standard Delivery fully serviceable."
        });
      } else {
        setDeliveryResult({
          eligible: false,
          message: "Location currently not serviceable for e-commerce shipment."
        });
      }
    }, 1200);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || submittingReview) return;
    setSubmittingReview(true);
    try {
      await shopService.createReview(id, userRating, userComment);
      toast({
        title: "Review Published 🌟",
        description: "Thank you! Your feedback has been posted."
      });
      setUserComment("");
      loadProductDetails();
    } catch (err: any) {
      toast({
        title: "Failed to Post Review",
        description: err.message || "Must be logged in to review products.",
        variant: "destructive"
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={true} hideHeader={true}>
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center gap-4">
          <PrePeSpinner className="w-12 h-12" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Unpacking Premium Gear...</p>
        </div>
      </Layout>
    );
  }

  if (!product) return null;

  const currentPrice = selectedVariant?.price_override ? selectedVariant.price_override : product.price;
  const isOutOfStock = selectedVariant ? selectedVariant.stock === 0 : product.totalStock === 0;

  return (
    <Layout showBottomNav={true} hideHeader={true}>
      <div className="min-h-screen bg-[#F8FAFC] pb-44 relative overflow-x-hidden">
        
        {/* Saffron Gradient Top */}
        <div className="absolute top-0 left-0 w-full h-[180px] bg-gradient-to-b from-[#FF671F]/5 to-transparent pointer-events-none" />

        {/* Navigation Bar */}
        <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 flex items-center justify-between shadow-sm">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.2em]">Product Profile</h2>
          <Link to="/cart" className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 relative active:scale-95 transition-all shadow-sm">
            <ShoppingCart className="w-4 h-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[#FF671F] border-2 border-white text-white font-black text-[9px] flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </Link>
        </div>

        {/* Image Zoom Gallery Carousel */}
        <div className="p-5 flex flex-col items-center">
          <div className="w-full max-w-sm aspect-square bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center p-6 shadow-sm overflow-hidden relative group">
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 hover:scale-125"
            />
          </div>
          {/* Thumbnails list */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2.5 mt-4">
              {product.images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(img)}
                  className={cn(
                    "w-12 h-12 bg-white rounded-xl border p-1 shadow-sm overflow-hidden transition-all",
                    activeImage === img ? "border-[#000080] ring-2 ring-[#000080]/10" : "border-slate-100 hover:border-slate-300"
                  )}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-contain mix-blend-multiply" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Details Body */}
        <div className="px-5 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FF671F]">{product.brand}</p>
                <h1 className="text-lg font-black text-slate-900 leading-tight mt-1">{product.title}</h1>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 bg-amber-50 text-amber-600 font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-sm">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>{product.rating.toFixed(1)}</span>
              </div>
            </div>
            
            <p className="text-slate-500 text-[12px] leading-relaxed mt-2">{product.description}</p>
          </div>

          {/* Platform Guarantees */}
          <div className="grid grid-cols-3 gap-2 py-4 border-y border-slate-100">
            <div className="flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-50 shadow-sm">
              <Truck className="w-5 h-5 text-[#FF671F] mb-1" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-800">Fast Shipping</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-50 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#000080] mb-1" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-800">100% Original</span>
            </div>
            <div className="flex flex-col items-center text-center p-2 rounded-2xl bg-white border border-slate-50 shadow-sm">
              <RotateCcw className="w-5 h-5 text-[#046A38] mb-1" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-800">7 Days Return</span>
            </div>
          </div>

          {/* Pricing & Stock Details */}
          <div className="flex justify-between items-center bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Price Details</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#000080]">₹{currentPrice.toFixed(2)}</span>
                {product.compare_at_price && (
                  <span className="text-xs text-slate-400 line-through">₹{product.compare_at_price.toFixed(2)}</span>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Availability</span>
              {isOutOfStock ? (
                <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 border border-rose-100 text-rose-600 px-3 py-1.5 rounded-full">
                  Out of Stock
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1.5 rounded-full">
                  Available
                </span>
              )}
            </div>
          </div>

          {/* Product Variants (e.g. Models or colors list) */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em]">Select Variant</h4>
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={cn(
                      "px-4 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-95 shadow-sm",
                      selectedVariant?.id === v.id
                        ? "bg-[#000080] border-[#000080] text-white"
                        : "bg-white border-slate-100 text-slate-700 hover:border-slate-350"
                    )}
                  >
                    {v.name} {v.price_override ? `(+₹${v.price_override - product.price})` : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Pincode Estimator */}
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em] flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#FF671F]" /> Delivery Estimator
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="Enter 6-digit Pincode"
                maxLength={6}
                className="bg-slate-50 border-none rounded-2xl h-11 text-xs font-bold pl-4 focus-visible:ring-[#FF671F]/20"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
              <Button
                onClick={handleCheckPincode}
                disabled={checkingPincode}
                className="bg-slate-900 text-white rounded-2xl h-11 px-5 hover:bg-slate-800 text-xs font-black uppercase tracking-widest shrink-0 shadow-sm"
              >
                {checkingPincode ? <PrePeSpinner className="w-4 h-4" /> : "Verify"}
              </Button>
            </div>
            
            {/* Delivery result display */}
            {deliveryResult && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border shadow-sm",
                  deliveryResult.eligible
                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-700"
                    : "bg-rose-50/50 border-rose-100 text-rose-700"
                )}
              >
                {deliveryResult.eligible ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Deliverable! Estimated dispatch arrives in <strong>{deliveryResult.days} Business Days</strong>.</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <span>{deliveryResult.message}</span>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Specifications Parameters Accordion */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em]">Technical Specifications</h4>
              <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-xs font-semibold text-slate-700">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <tr key={key} className={cn("border-b border-slate-50 last:border-0", idx % 2 === 0 ? "bg-slate-50/50" : "bg-white")}>
                        <td className="p-4 font-black text-slate-400 uppercase text-[9px] tracking-wider w-1/3 border-r border-slate-50">{key}</td>
                        <td className="p-4 pl-6 text-slate-800">{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Seller / Vendor information */}
          {seller && (
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Seller Profile</span>
                <span className="text-sm font-black text-[#000080]">{seller.company_name}</span>
              </div>
              <span className="text-[9px] font-black uppercase bg-[#046A38]/10 border border-[#046A38]/20 text-[#046A38] px-3 py-1.5 rounded-full">
                Pre-pe Verified
              </span>
            </div>
          )}

          {/* Quantity selector & Add to Bag / Buy Now floating triggers */}
          {!isOutOfStock && (
            <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">Select Quantity</span>
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-2xl px-3 py-1.5">
                <button
                  onClick={() => quantity > 1 && setQuantity(quantity - 1)}
                  className="h-7 w-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all shadow-sm"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-black text-slate-800 min-w-5 text-center">{quantity}</span>
                <button
                  onClick={() => {
                    const maxStock = selectedVariant?.stock || product.totalStock;
                    if (quantity < maxStock) {
                      setQuantity(quantity + 1);
                    } else {
                      toast({
                        title: "Limit Exceeded",
                        description: `Only ${maxStock} items available in stock.`,
                        variant: "destructive"
                      });
                    }
                  }}
                  className="h-7 w-7 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-600 active:scale-90 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Ratings & Reviews block */}
          <div className="space-y-4 pt-4">
            <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em]">Reviews ({reviews.length})</h4>
            
            {/* Submit review Form */}
            <form onSubmit={handleSubmitReview} className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Leave a Review</h4>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Rating (1 to 5 Stars)</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="p-1 hover:scale-110 active:scale-90 transition-all"
                    >
                      <Star className={cn("w-6 h-6", star <= userRating ? "fill-amber-500 text-amber-500" : "text-slate-200")} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Your Feedback</label>
                <textarea
                  placeholder="Share your experience with this premium accessory..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF671F]/10 min-h-[80px]"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-[#000080] hover:bg-[#000080]/90 text-white rounded-2xl h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/10"
              >
                {submittingReview ? <PrePeSpinner className="w-4 h-4" /> : "Publish Feedback"}
              </Button>
            </form>

            {/* List of reviews */}
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-black text-[#000080]">
                        U
                      </div>
                      <span className="text-xs font-bold text-slate-800">Verified Buyer</span>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-600">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span className="text-[10px] font-black">{rev.rating}.0</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed pl-9">"{rev.comment}"</p>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-9">
                    {new Date(rev.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
              {reviews.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-6">Be the first to review this accessory.</p>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Action Sticky Footer — sits ABOVE the 64px BottomNav */}
        <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center px-4">
          <div className="w-full max-w-md flex gap-3 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl p-3 shadow-2xl">
            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 rounded-xl h-13 text-xs font-black uppercase tracking-widest shadow-sm"
            >
              Add To Bag
            </Button>
            <Button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 bg-[#FF671F] hover:bg-[#FF671F]/90 text-white rounded-xl h-13 text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
            >
              Buy Now
            </Button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
