import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { shopService, ProductItem } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Search, ShoppingCart, Star, Filter, ArrowUpDown, ChevronRight, ArrowRight,
  Package, Smartphone, HelpCircle, Shield, Award, Sparkles, Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ShopListingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const AUTHORIZED_ADMINS = [
    'connect.prepe@gmail.com',
    'prepeindia@outlook.com',
    'prepeindia@zohomail.in',
    'jeevasuriya2007@gmail.com'
  ];

  const isAdmin = AUTHORIZED_ADMINS.includes(user?.email || '');
  const isBusinessUser = profile?.plan_type?.toUpperCase() === 'BUSINESS';
  
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // Market and access states
  const [marketTab, setMarketTab] = useState<'retail' | 'wholesale'>('retail');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  useEffect(() => {
    loadCategories();
    loadCartCount();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, sortBy, marketTab]);

  const loadCategories = async () => {
    try {
      const data = await shopService.getCategories();
      setCategories(data);
    } catch (err) {
      console.error("Categories fetch failed:", err);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await shopService.getProducts({
        categoryId: selectedCategory || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sortBy
      });
      
      const filtered = data.filter(product => {
        const isProductWholesale = (product.specifications as any)?.target_market === 'wholesale';
        return marketTab === 'wholesale' ? isProductWholesale : !isProductWholesale;
      });

      setProducts(filtered);
    } catch (err) {
      console.error("Products fetch failed:", err);
      toast({
        title: "Database Error",
        description: "Failed to query the accessories catalog.",
        variant: "destructive"
      });
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

  const handleAddToCart = async (e: React.MouseEvent, product: ProductItem) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const variantId = product.variants?.[0]?.id || null;
      await shopService.addToCart(product.id, variantId, 1);
      toast({
        title: "Cart Updated 🎉",
        description: `Successfully added ${product.title} to your bag.`
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

  const triggerSearch = () => {
    loadProducts();
  };

  const resetFilters = () => {
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategory("");
    loadProducts();
  };

  const handleWholesaleTabClick = () => {
    if (!isBusinessUser) {
      setShowUpgradeModal(true);
    } else {
      setMarketTab('wholesale');
    }
  };

  return (
    <Layout showBottomNav={true} hideHeader={true}>
      <div className="min-h-screen bg-[#F8FAFC] pb-24 relative overflow-x-hidden">
        
        {/* Flag Theme Background Accents */}
        <div className="absolute top-0 left-0 w-full h-[220px] bg-gradient-to-b from-[#FF671F]/10 to-transparent pointer-events-none" />
        
        {/* Executive Header */}
        <header className="sticky top-0 z-[60] bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-5 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-[#FF671F] flex items-center justify-center text-white shadow-md active:scale-95 transition-all cursor-pointer" onClick={() => navigate('/home')}>
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[#000080] tracking-tight">Accessories Hub</h1>
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#046A38]">Premium Mobile Gears</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/seller/dashboard" className="text-[9px] font-black uppercase tracking-widest px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100 text-slate-600 transition-all">
                Wholesale
              </Link>
            )}
            <Link to="/cart" className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 relative active:scale-95 transition-all shadow-sm">
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-[#FF671F] border-2 border-white text-white font-black text-[9px] flex items-center justify-center px-1 shadow-sm">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Market Segment Selector */}
        <div className="px-5 mt-5">
          <div className="bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50 flex w-full h-12 shadow-inner">
            <button
              onClick={() => setMarketTab('retail')}
              className={cn(
                "flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5",
                marketTab === 'retail' 
                  ? "bg-[#046A38] text-white shadow-md shadow-green-700/10 scale-[1.02]" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Retail Shop
            </button>
            <button
              onClick={handleWholesaleTabClick}
              className={cn(
                "flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5 relative",
                marketTab === 'wholesale' 
                  ? "bg-[#FF671F] text-white shadow-md shadow-orange-600/10 scale-[1.02]" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Wholesale (B2B)
              {!isBusinessUser && (
                <span className="text-[7px] font-black tracking-widest text-[#FF671F] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded-full uppercase scale-90">PRO</span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Horizontal Carousel */}
        <div className="px-5 mt-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.15em]">Browse Categories</h3>
            {selectedCategory && (
              <button onClick={() => setSelectedCategory("")} className="text-[10px] font-black text-[#FF671F] uppercase tracking-wider">
                Clear Category
              </button>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id === selectedCategory ? "" : cat.id)}
                className={cn(
                  "flex items-center gap-2 shrink-0 px-4 py-3 rounded-2xl border text-xs font-bold transition-all active:scale-95 shadow-sm",
                  selectedCategory === cat.id
                    ? "bg-[#000080] border-[#000080] text-white"
                    : "bg-white border-slate-100 text-slate-700 hover:border-slate-350"
                )}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-5 mt-5 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search screen glass, chargers, covers..."
              className="pl-10 h-11 bg-white border-slate-100 rounded-2xl focus-visible:ring-[#FF671F]/20 text-xs font-semibold shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && triggerSearch()}
            />
          </div>
          <Button
            onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
            className="h-11 w-11 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:bg-slate-50 flex items-center justify-center p-0 shrink-0 shadow-sm"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Interactive Filters Drawer (Glassmorphic Slide down) */}
        <AnimatePresence>
          {showFiltersDrawer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 mt-3 overflow-hidden"
            >
              <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-[#FF671F]" /> Filter Options
                  </h4>
                  <button onClick={resetFilters} className="text-[10px] font-black uppercase tracking-wider text-rose-600">
                    Reset
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Min Price (₹)</label>
                    <Input
                      placeholder="e.g. 100"
                      type="number"
                      className="h-9 mt-1 bg-slate-50 border-none rounded-xl text-xs font-bold"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Max Price (₹)</label>
                    <Input
                      placeholder="e.g. 1999"
                      type="number"
                      className="h-9 mt-1 bg-slate-50 border-none rounded-xl text-xs font-bold"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Sort Products By</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "popular", label: "Popular" },
                      { key: "price-asc", label: "₹ Low to High" },
                      { key: "price-desc", label: "₹ High to Low" }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setSortBy(opt.key)}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-bold border transition-all",
                          sortBy === opt.key
                            ? "bg-[#000080]/5 text-[#000080] border-[#000080]"
                            : "bg-white border-slate-100 text-slate-500"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={loadProducts} className="w-full bg-[#FF671F] hover:bg-[#FF671F]/90 text-white rounded-2xl h-11 text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/10">
                  Apply Search Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid Listing */}
        <main className="px-5 mt-6">
          <div className="flex justify-between items-center mb-4 px-1">
            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.2em]">Latest Catalog</h3>
            <p className="text-[10px] font-bold text-slate-500">{products.length} Products Available</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-[2rem] p-4 space-y-3 shadow-sm animate-pulse">
                  <div className="aspect-square bg-slate-50 rounded-2xl w-full" />
                  <div className="h-4 bg-slate-100 rounded-md w-3/4" />
                  <div className="h-3 bg-slate-50 rounded-md w-1/2" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-5 bg-slate-100 rounded-md w-1/3" />
                    <div className="h-8 bg-slate-100 rounded-full w-8" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300">
                <Package className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">No Accessories Listed</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-[220px] mx-auto">There are no products listed matching your selected criteria.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {products.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -4, shadow: "0 10px 30px rgba(0,0,0,0.05)" }}
                  className="bg-white border border-slate-100 rounded-[2rem] p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group transition-all"
                >
                  <Link to={`/product/${item.id}`} className="flex-1 flex flex-col justify-between">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3 flex items-center justify-center p-2 border border-slate-50">
                      <img
                        src={item.images?.[0] || "https://placehold.co/400x400/png?text=Gear"}
                        alt={item.title}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                      />
                      {item.compare_at_price && (
                        <div className="absolute top-2 left-2 bg-[#046A38] text-white font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full shadow-sm">
                          Save {Math.round(((item.compare_at_price - item.price) / item.compare_at_price) * 100)}%
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-[8px] font-black uppercase tracking-widest text-[#FF671F]">{item.brand}</p>
                      <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#000080] transition-colors">{item.title}</h4>
                      
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <div className="flex items-center gap-0.5 bg-amber-50 text-amber-600 font-extrabold text-[9px] px-1.5 py-0.5 rounded-md">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>{item.rating || "5.0"}</span>
                        </div>
                        <span className="text-[8px] font-extrabold uppercase text-slate-400 tracking-wider">
                          {item.totalStock > 0 ? "In Stock" : "Sold Out"}
                        </span>
                      </div>
                    </div>
                  </Link>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#000080]">₹{item.price.toFixed(2)}</span>
                      {item.compare_at_price && (
                        <span className="text-[9px] text-slate-400 line-through">₹{item.compare_at_price.toFixed(2)}</span>
                      )}
                    </div>
                    
                    {item.totalStock > 0 ? (
                      <Button
                        onClick={(e) => handleAddToCart(e, item)}
                        size="icon"
                        className="h-8 w-8 rounded-full bg-[#FF671F] hover:bg-[#FF671F]/90 text-white shadow-sm flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                      </Button>
                    ) : (
                      <span className="text-[8px] font-black text-rose-500 uppercase bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg">
                        Out
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>

        {/* Quality Assured Seal */}
        <div className="px-5 mt-10">
          <div className="bg-[#000080]/5 rounded-[2rem] border border-[#000080]/10 p-5 flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center text-[#000080] shadow-sm shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#000080] uppercase tracking-wider">Pre-pe Assured Standard</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">100% Genuine Mobile Accessories. Quality audited, secured transactions, and immediate delivery.</p>
            </div>
          </div>
        </div>

        {/* Business Upgrade Promotion Modal */}
        <AnimatePresence>
          {showUpgradeModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUpgradeModal(false)}
                className="absolute inset-0 bg-slate-950/40 backdrop-blur-md"
              />
              {/* Content Panel */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 p-7 shadow-2xl relative w-full max-w-sm flex flex-col items-center text-center space-y-6 overflow-hidden z-30"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-orange-500/10 to-transparent rounded-full pointer-events-none" />
                
                <div className="w-16 h-16 bg-gradient-to-tr from-[#FF671F] to-orange-500 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-orange-500/20 relative animate-bounce">
                  <Award className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#FF671F] bg-orange-50 border border-orange-100 px-3 py-1 rounded-full w-fit mx-auto">
                    Business Plan Exclusive
                  </span>
                  <h3 className="text-xl font-black text-[#000080] tracking-tight pt-1">Wholesale Shop Restricted</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[240px] mx-auto">
                    Wholesale B2B lower rates, bulk packings, and direct reseller benefits are exclusive to our **Business Plan** partners.
                  </p>
                </div>

                <div className="w-full space-y-2">
                  <Button 
                    onClick={() => {
                      setShowUpgradeModal(false);
                      navigate('/upgrade');
                    }}
                    className="w-full rounded-2xl bg-gradient-to-r from-[#FF671F] to-orange-600 hover:scale-102 active:scale-98 shadow-md text-white font-black text-xs uppercase tracking-widest h-12 flex items-center justify-center gap-1.5"
                  >
                    Upgrade Plan Now <ArrowRight className="w-4 h-4" />
                  </Button>
                  <button 
                    onClick={() => setShowUpgradeModal(false)}
                    className="w-full py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-wider"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Layout>
  );
}
