import { useState, useEffect } from "react";
import { shopService, ProductItem } from "@/services/shop.service";
import { useToast } from "@/hooks/use-toast";
import {
  Package, Search, Star, Trash2, Eye, EyeOff, ShieldCheck,
  Award, Building, AlertCircle, ShieldAlert, Tag
} from "lucide-react";
import { BrandLoader } from '@/components/ui/BrandLoader';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminProducts() {
  const { toast } = useToast();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await shopService.getProducts({});
      setProducts(data);
    } catch (err) {
      console.error("Admin products load failed:", err);
      toast({
        title: "Database Error",
        description: "Failed to query overall products catalog.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await shopService.approveProduct(id, newStatus);
      toast({
        title: newStatus ? "Product Activated 🟢" : "Product Deactivated 🔴",
        description: newStatus
          ? "The item is now live and listed inside the shopping hub."
          : "The item has been removed from customer listings."
      });
      loadProducts();
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message || "Failed to update product state.",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <BrandLoader size="md" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Gathering Merchandise...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Overview Card */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF671F] shadow-sm">
          <Package className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-black text-[#000080] uppercase tracking-wider">Product Catalog Moderation</h2>
          <p className="text-xs text-slate-400 font-medium">Verify listed accessories and deactivate listings violating compliance terms.</p>
        </div>
      </div>

      {/* Query search */}
      <div className="relative text-xs font-bold">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by product name, brand, or store ID..."
          className="pl-10 h-11 bg-white border-slate-100 rounded-2xl focus-visible:ring-[#FF671F]/20 font-bold text-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products list */}
      <div className="space-y-4">
        {filteredProducts.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-sm space-y-4 flex flex-col transition-all hover:shadow-md"
          >
            <div className="flex gap-4">
              <div className="w-16 h-16 bg-slate-50 border border-slate-50 rounded-2xl flex items-center justify-center p-1.5 shrink-0">
                <img src={item.images?.[0]} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center text-xs font-bold">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-[8px] font-black uppercase text-[#FF671F] tracking-widest">{item.brand}</p>
                    <h4 className="text-slate-800 line-clamp-1 leading-snug mt-0.5">{item.title}</h4>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded-full border text-[8px] font-black uppercase tracking-widest shrink-0",
                    item.is_active ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
                  )}>
                    {item.is_active ? "LIVE" : "DEACTIVATED"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#000080] font-black text-sm">₹{item.price.toFixed(2)}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-slate-50 border border-slate-100 text-slate-400 px-2 py-0.5 rounded-md">
                    {item.category?.name}
                  </span>
                </div>
              </div>
            </div>

            {/* Seller attribution */}
            <div className="p-3 bg-slate-50/50 rounded-2xl border border-slate-50 text-[10px] font-semibold text-slate-500 flex justify-between items-center">
              <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> Seller Store:</span>
              <span className="text-slate-800 font-black uppercase tracking-widest text-[9px]">#{item.seller_id.substring(0, 8)}</span>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-1 pt-1">
              <Button
                onClick={() => handleToggleActive(item.id, item.is_active)}
                variant="outline"
                className={cn(
                  "rounded-xl h-10 text-[9px] font-black uppercase tracking-widest flex items-center justify-center p-0 border shadow-sm transition-all",
                  item.is_active
                    ? "border-rose-100 hover:bg-rose-50 text-rose-600"
                    : "border-emerald-100 hover:bg-emerald-50 text-emerald-600"
                )}
              >
                {item.is_active ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 mr-1.5" /> Deactivate Listing
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 mr-1.5" /> Activate Listing
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-350">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800">No items found</h4>
              <p className="text-[10px] text-slate-400 mt-1">There are no matching products listed in the catalog.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
