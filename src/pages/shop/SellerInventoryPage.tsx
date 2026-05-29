import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { shopService, ProductItem } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  ChevronLeft, Package, Plus, Trash2, Edit2, Star, CheckCircle2,
  ListPlus, Sparkles, Image, Settings, DollarSign, Loader2, Save, X, ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SellerInventoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Product Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [brand, setBrand] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [targetMarket, setTargetMarket] = useState("retail");

  // Dynamic Specs additions
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [specifications, setSpecifications] = useState<Record<string, string>>({});

  // Dynamic Variants additions
  const [variantName, setVariantName] = useState("");
  const [variantStock, setVariantStock] = useState("");
  const [variantPrice, setVariantPrice] = useState("");
  const [variantsList, setVariantsList] = useState<any[]>([]);

  // Inline stock edit states
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState("");
  const [savingStock, setSavingStock] = useState(false);

  useEffect(() => {
    if (authLoading || profileLoading) return;

    const AUTHORIZED_ADMINS = [
      'connect.prepe@gmail.com',
      'prepeindia@outlook.com',
      'prepeindia@zohomail.in',
      'jeevasuriya2007@gmail.com'
    ];
    const isAdmin = AUTHORIZED_ADMINS.includes(user?.email || '');
    const isBusiness = profile?.plan_type?.toUpperCase() === 'BUSINESS';

    if (!isAdmin && !isBusiness) {
      toast({
        title: "Access Denied",
        description: "Seller portal is restricted to Business plan users and authorized administrators.",
        variant: "destructive"
      });
      navigate("/shop");
      return;
    }

    loadInventory();
  }, [user, authLoading, profile, profileLoading]);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await shopService.getSellerProducts();
      setProducts(data);

      const cats = await shopService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error("Seller inventory failed:", err);
      toast({
        title: "Load Error",
        description: "Failed to fetch merchant inventory logs.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSpecification = () => {
    if (!specKey || !specValue) return;
    setSpecifications(prev => ({ ...prev, [specKey]: specValue }));
    setSpecKey("");
    setSpecValue("");
  };

  const handleRemoveSpecification = (key: string) => {
    setSpecifications(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleAddVariant = () => {
    if (!variantName || !variantStock) return;
    setVariantsList(prev => [
      ...prev,
      {
        name: variantName,
        stock: Number(variantStock),
        price_override: variantPrice ? Number(variantPrice) : null
      }
    ]);
    setVariantName("");
    setVariantStock("");
    setVariantPrice("");
  };

  const handleRemoveVariant = (index: number) => {
    setVariantsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingProduct) return;
    if (!title || !description || !categoryId || !price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required product fields.",
        variant: "destructive"
      });
      return;
    }

    setSubmittingProduct(true);
    try {
      const imagesList = imageUrl ? [imageUrl] : ["https://placehold.co/400x400/png?text=Premium+Gear"];
      
      const mergedSpecs = {
        ...specifications,
        target_market: targetMarket
      };

      await shopService.createProduct({
        title,
        description,
        category_id: categoryId,
        price: Number(price),
        compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
        brand: brand || "Generic",
        images: imagesList,
        specifications: mergedSpecs,
        variants: variantsList
      });

      toast({
        title: "Merchandise Created 📦",
        description: `${title} is now successfully listed in the store.`
      });

      // Reset form states
      setTitle("");
      setDescription("");
      setCategoryId("");
      setPrice("");
      setCompareAtPrice("");
      setBrand("");
      setImageUrl("");
      setSpecifications({});
      setVariantsList([]);
      setTargetMarket("retail");
      setShowAddForm(false);

      loadInventory();
    } catch (err: any) {
      toast({
        title: "Product Listing Failed",
        description: err.message || "Failed to create catalog entry.",
        variant: "destructive"
      });
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleSaveStock = async (variantId: string) => {
    if (savingStock || !editStockValue) return;
    const newStock = Number(editStockValue);
    if (isNaN(newStock) || newStock < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid stock level.",
        variant: "destructive"
      });
      return;
    }

    setSavingStock(true);
    try {
      await shopService.updateVariantStock(variantId, newStock);
      toast({
        title: "Stock Updated 📦",
        description: "Successfully updated inventory stock levels."
      });
      setEditingVariantId(null);
      loadInventory();
    } catch (err: any) {
      toast({
        title: "Stock Update Failed",
        description: err.message || "Failed to alter variant stock.",
        variant: "destructive"
      });
    } finally {
      setSavingStock(false);
    }
  };

  if (authLoading) {
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
      <div className="min-h-screen bg-[#F8FAFC] pb-32 relative overflow-x-hidden">
        
        {/* Navy Accents */}
        <div className="absolute top-0 left-0 w-full h-[180px] bg-gradient-to-b from-[#000080]/5 to-transparent pointer-events-none" />

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/seller/dashboard')} className="p-1 hover:bg-slate-100 rounded-full transition-all">
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </button>
            <h2 className="text-xs uppercase font-extrabold text-slate-400 tracking-[0.2em]">Product Catalog</h2>
          </div>
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-[10px] font-black uppercase text-[#FF671F] tracking-widest flex items-center gap-1 bg-white border border-slate-100 shadow-sm rounded-xl px-3 py-2 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </header>

        <div className="px-5 mt-6 space-y-6">
          
          {/* Add product Wizard form overlay */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                onSubmit={handleCreateProduct}
                className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-xl space-y-4 text-xs font-bold relative z-20"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-600 flex items-center gap-1">
                    <ListPlus className="w-4 h-4" /> Create Accessories Listing
                  </h4>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-[10px] uppercase font-black text-rose-500">
                    Cancel
                  </button>
                </div>

                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Product Title *</label>
                    <Input
                      placeholder="e.g. Ultra Armor iPhone 15 Pro Case"
                      className="bg-slate-50 border-none rounded-xl h-11 pl-4 font-bold"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Category *</label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl h-11 px-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF671F]/10"
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Market *</label>
                    <select
                      className="w-full bg-slate-50 border-none rounded-xl h-11 px-4 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#FF671F]/10"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                      required
                    >
                      <option value="retail">Retail (B2C) User</option>
                      <option value="wholesale">Wholesale (B2B) Partner</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Selling Price (₹) *</label>
                      <Input
                        placeholder="e.g. 299"
                        type="number"
                        className="bg-slate-50 border-none rounded-xl h-11 pl-4 font-bold"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">MSRP Price (₹) (Optional)</label>
                      <Input
                        placeholder="e.g. 599"
                        type="number"
                        className="bg-slate-50 border-none rounded-xl h-11 pl-4 font-bold"
                        value={compareAtPrice}
                        onChange={(e) => setCompareAtPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Brand Name *</label>
                    <Input
                      placeholder="e.g. Spigen, PrePe Assured"
                      className="bg-slate-50 border-none rounded-xl h-11 pl-4 font-bold"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Image Resource Link</label>
                    <Input
                      placeholder="e.g. https://images.com/cover.png"
                      className="bg-slate-50 border-none rounded-xl h-11 pl-4 font-bold"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Product Description *</label>
                    <textarea
                      placeholder="Write specifications highlight, protective layers details..."
                      className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF671F]/10 min-h-[80px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  {/* Technical Specifications adding lists */}
                  <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-2">
                    <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Specifications Accordion</h5>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Key (e.g. Material)"
                        className="bg-white border-none rounded-lg h-9 text-xs pl-2.5 font-bold"
                        value={specKey}
                        onChange={(e) => setSpecKey(e.target.value)}
                      />
                      <Input
                        placeholder="Value (e.g. TPU Polycarbonate)"
                        className="bg-white border-none rounded-lg h-9 text-xs pl-2.5 font-bold"
                        value={specValue}
                        onChange={(e) => setSpecValue(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={handleAddSpecification}
                        className="h-9 w-9 p-0 bg-[#000080] text-white rounded-lg flex items-center justify-center shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {Object.entries(specifications).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-600">
                        <span>{k}: <strong>{v}</strong></span>
                        <button type="button" onClick={() => handleRemoveSpecification(k)} className="text-rose-500 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Product Variants setup */}
                  <div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-3">
                    <h5 className="text-[9px] font-black uppercase tracking-wider text-slate-400">Variants Configurator (Colors / Sizes / Models)</h5>
                    <div className="space-y-2">
                      <Input
                        placeholder="Variant Label (e.g. Clear Saffron)"
                        className="bg-white border-none rounded-lg h-9 text-xs pl-2.5 font-bold"
                        value={variantName}
                        onChange={(e) => setVariantName(e.target.value)}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Initial Stock (e.g. 50)"
                          type="number"
                          className="bg-white border-none rounded-lg h-9 text-xs pl-2.5 font-bold"
                          value={variantStock}
                          onChange={(e) => setVariantStock(e.target.value)}
                        />
                        <Input
                          placeholder="Price Override (Optional)"
                          type="number"
                          className="bg-white border-none rounded-lg h-9 text-xs pl-2.5 font-bold"
                          value={variantPrice}
                          onChange={(e) => setVariantPrice(e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddVariant}
                        className="w-full h-9 bg-slate-900 text-white rounded-lg text-[10px] uppercase font-black tracking-widest flex items-center justify-center p-0 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
                      </Button>
                    </div>
                    {variantsList.map((v, i) => (
                      <div key={i} className="flex justify-between items-center py-2 border-b border-slate-100 text-[10px] font-bold text-slate-650">
                        <span>{v.name} • Stock: <strong>{v.stock}</strong> {v.price_override ? `• ₹${v.price_override}` : ""}</span>
                        <button type="button" onClick={() => handleRemoveVariant(i)} className="text-rose-500 hover:text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submittingProduct}
                  className="w-full bg-[#FF671F] hover:bg-[#FF671F]/90 text-white rounded-2xl h-14 text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-between px-6"
                >
                  <span>Publish Product Catalog</span>
                  {submittingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Product Items Inventory catalog list */}
          <main className="space-y-4">
            {products.map((item) => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-center p-1.5 shrink-0">
                    <img src={item.images?.[0]} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center text-xs font-bold">
                    <p className="text-[8px] font-black uppercase text-[#FF671F] tracking-widest">{item.brand}</p>
                    <h4 className="text-slate-800 line-clamp-1 leading-snug mt-0.5">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[#000080] font-black text-sm">₹{item.price.toFixed(2)}</span>
                      <span className="text-[8px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 text-slate-400 px-2 py-0.5 rounded-md">
                        {item.category?.name}
                      </span>
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                        (item.specifications as any)?.target_market === 'wholesale' 
                          ? "bg-orange-50 border-orange-200 text-[#FF671F]" 
                          : "bg-emerald-50 border-emerald-200 text-[#046A38]"
                      )}>
                        {(item.specifications as any)?.target_market === 'wholesale' ? "Wholesale B2B" : "Retail B2C"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Variants inventory stock controls */}
                <div className="space-y-2 border-t border-slate-50 pt-3">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-1">Stock Allocations & Editing</span>
                  {item.variants.map((v) => (
                    <div key={v.id} className="flex justify-between items-center bg-slate-50/50 border border-slate-50 rounded-2xl p-3 text-xs font-bold text-slate-700">
                      <span>{v.name} (SKU: {v.sku.substring(0, 8)})</span>
                      {editingVariantId === v.id ? (
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            className="bg-white border-slate-200 rounded-xl h-8 w-16 text-center text-xs font-black p-0"
                            value={editStockValue}
                            onChange={(e) => setEditStockValue(e.target.value)}
                          />
                          <button
                            onClick={() => handleSaveStock(v.id)}
                            disabled={savingStock}
                            className="p-1.5 bg-emerald-500 text-white rounded-xl active:scale-90 transition-all shadow-sm"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingVariantId(null)}
                            className="p-1.5 bg-rose-500 text-white rounded-xl active:scale-90 transition-all shadow-sm"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest",
                            v.stock <= 5 ? "bg-rose-50 border-rose-100 text-rose-600" : "bg-emerald-50 border-emerald-100 text-emerald-600"
                          )}>
                            Stock: {v.stock}
                          </span>
                          <button
                            onClick={() => {
                              setEditingVariantId(v.id);
                              setEditStockValue(v.stock.toString());
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 active:scale-90 transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-350">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800">Inventory empty</h4>
                  <p className="text-[10px] text-slate-400 mt-1">Start adding mobile accessories using the Add New trigger.</p>
                </div>
              </div>
            )}
          </main>

        </div>

      </div>
    </Layout>
  );
}
