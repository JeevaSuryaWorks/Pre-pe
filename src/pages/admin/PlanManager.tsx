import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, 
    Save, 
    Plus, 
    Trash2, 
    Zap, 
    Landmark, 
    Building2, 
    AlertCircle, 
    ArrowLeft, 
    ArrowRight,
    Star,
    ShieldCheck,
    Activity,
    Crown
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";

const PlanManager = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setLoading(true);
        try {
            const data = await adminService.getPlans();
            setPlans(data || []);
        } catch (e) {
            toast.error("Failed to load plans. Make sure the 'plans' table exists in database.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleMove = async (index: number, direction: 'left' | 'right') => {
        const newPlans = [...plans];
        const targetIndex = direction === 'left' ? index - 1 : index + 1;
        
        if (targetIndex < 0 || targetIndex >= newPlans.length) return;

        // Swap the order_index values
        const plan1 = newPlans[index];
        const plan2 = newPlans[targetIndex];
        
        const tempOrder = plan1.order_index;
        plan1.order_index = plan2.order_index;
        plan2.order_index = tempOrder;

        // Optimistically update UI
        newPlans[index] = plan2;
        newPlans[targetIndex] = plan1;
        setPlans(newPlans);

        try {
            // Update both in DB
            await Promise.all([
                adminService.updatePlan(plan1.id, { order_index: plan1.order_index }),
                adminService.updatePlan(plan2.id, { order_index: plan2.order_index })
            ]);
            toast.success("Order updated");
        } catch (e) {
            toast.error("Failed to sync order to database");
            fetchPlans(); // Rollback
        }
    };

    const handleEdit = (plan: any) => {
        setEditingPlan({ 
            ...plan, 
            features: [...plan.features], // Clone to avoid direct mutation
            config: plan.config || {
                dailyRechargeLimit: 5,
                dailyWalletAddLimit: 500,
                maxWalletBalance: 1000,
                bnplLimit: 0,
                bnplCycleDays: 0,
                features: {
                    bnpl: false,
                    cashback: false,
                    ads: true,
                    prioritySupport: false,
                    bulkTools: false,
                    rewards: 'BASIC'
                }
            }
        });
    };

    const handleUpdateFeature = (index: number, value: string) => {
        const newFeatures = [...editingPlan.features];
        newFeatures[index] = value;
        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    const handleAddFeature = () => {
        setEditingPlan({ 
            ...editingPlan, 
            features: [...editingPlan.features, ""] 
        });
    };

    const handleRemoveFeature = (index: number) => {
        const newFeatures = editingPlan.features.filter((_: any, i: number) => i !== index);
        setEditingPlan({ ...editingPlan, features: newFeatures });
    };

    const handleSave = async () => {
        if (!editingPlan) return;
        setSaving(true);
        try {
            // Filter out empty features
            const finalFeatures = editingPlan.features.filter((f: string) => f.trim() !== '');
            
            await adminService.updatePlan(editingPlan.id, {
                name: editingPlan.name,
                price: editingPlan.price,
                price_amount: parseFloat(editingPlan.price_amount) || 0,
                subtitle: editingPlan.subtitle,
                description: editingPlan.description,
                features: finalFeatures,
                is_popular: editingPlan.is_popular,
                config: editingPlan.config || {}
            });
            
            toast.success("Plan updated successfully");
            setEditingPlan(null);
            fetchPlans();
        } catch (e: any) {
            console.error("Save Error:", e);
            if (e.message?.includes("400") || e.code === "PGRST204") {
                toast.error("Database mismatch. Please run the 'Payment Columns Sync' SQL script provided by the assistant.");
            } else {
                toast.error(e.message || "Failed to update plan");
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="h-48 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Plan Manager</h2>
                <p className="text-slate-500 mt-1">Modify subscription plan details, prices, and features appearing on the onboarding page.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className={`border-slate-200 transition-all hover:shadow-lg ${plan.id === editingPlan?.id ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="uppercase text-[10px] font-bold">
                                    ID: {plan.id}
                                </Badge>
                                {plan.is_popular && <Badge className="bg-blue-600 text-white text-[10px]">MOST POPULAR</Badge>}
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                <div className="flex gap-1">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600"
                                        disabled={plans.indexOf(plan) === 0}
                                        onClick={() => handleMove(plans.indexOf(plan), 'left')}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600"
                                        disabled={plans.indexOf(plan) === plans.length - 1}
                                        onClick={() => handleMove(plans.indexOf(plan), 'right')}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <CardDescription className="text-lg font-black text-slate-900">{plan.price}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-xs text-slate-500 line-clamp-2 italic">"{plan.description}"</p>
                            <Button 
                                variant="outline" 
                                className="w-full rounded-xl font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleEdit(plan)}
                            >
                                Edit Plan Details
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Edit Plan Dialog */}
            <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-3xl border-none shadow-2xl">
                    <DialogHeader className="bg-slate-900 text-white p-8">
                        <DialogTitle className="text-2xl font-bold">Edit {editingPlan?.name} Plan</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Updates will be reflected instantly across the platform.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Left Column: Metadata & Identity */}
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Identity</Label>
                                    <div className="space-y-4 pt-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-600">Display Name</Label>
                                            <Input 
                                                value={editingPlan?.name || ""} 
                                                onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                                className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500/20 transition-all font-semibold"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-600">Subtitle</Label>
                                            <Input 
                                                value={editingPlan?.subtitle || ""} 
                                                onChange={(e) => setEditingPlan({...editingPlan, subtitle: e.target.value})}
                                                className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-medium"
                                                placeholder="e.g. For individuals"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pricing Model</Label>
                                    <div className="grid grid-cols-1 gap-4 pt-2">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-slate-600">Price Tag (Label)</Label>
                                            <Input 
                                                value={editingPlan?.price || ''} 
                                                onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                                                className="h-12 rounded-2xl bg-slate-50 border-slate-200 font-bold text-blue-600"
                                                placeholder="e.g. ₹500/Lifetime"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-blue-700">Checkout Amount (INR)</Label>
                                            <Input 
                                                type="number"
                                                value={editingPlan?.price_amount ?? ''} 
                                                onChange={(e) => setEditingPlan({...editingPlan, price_amount: e.target.value})}
                                                className="h-12 rounded-2xl bg-blue-50/50 border-blue-200 font-black text-lg focus:ring-blue-500/20"
                                            />
                                            <p className="px-1 text-[10px] text-slate-400 font-medium italic">Actual amount collected via Razorpay. Set to 0 for Free.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-5 bg-blue-600/5 rounded-[24px] border border-blue-600/10 group transition-all hover:bg-blue-600/10">
                                    <div className="space-y-0.5">
                                        <Label className="font-black text-blue-900 text-sm">Most Popular</Label>
                                        <p className="text-[10px] text-blue-600/60 font-bold uppercase tracking-tight">Show specialized badge</p>
                                    </div>
                                    <Switch 
                                        checked={editingPlan?.is_popular || false}
                                        onCheckedChange={(v) => setEditingPlan({...editingPlan, is_popular: v})}
                                    />
                                </div>
                            </div>

                            {/* Right Column: Functional Logic */}
                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-1 flex items-center gap-2">
                                        <Zap className="w-3 h-3 fill-current" /> Functional Configuration
                                    </Label>
                                    <div className="bg-slate-50/80 border border-slate-200/60 rounded-[32px] p-6 space-y-6 pt-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                        
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 font-black uppercase">Daily Recharges</Label>
                                                <Input 
                                                    type="number"
                                                    value={editingPlan?.config?.dailyRechargeLimit ?? ''}
                                                    onChange={(e) => setEditingPlan({
                                                        ...editingPlan,
                                                        config: { ...(editingPlan.config || {}), dailyRechargeLimit: e.target.value }
                                                    })}
                                                    className="h-10 rounded-xl bg-white border-slate-200 font-bold text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 font-black uppercase">BNPL Limit (₹)</Label>
                                                <Input 
                                                    type="number"
                                                    value={editingPlan?.config?.bnplLimit ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const numVal = parseInt(val) || 0;
                                                        setEditingPlan({
                                                            ...editingPlan,
                                                            config: { 
                                                                ...(editingPlan.config || {}), 
                                                                bnplLimit: val,
                                                                features: { 
                                                                    ...(editingPlan.config?.features || {}), 
                                                                    bnpl: numVal > 0 || (parseInt(editingPlan.config?.bnplCycleDays) || 0) > 0 ? true : (editingPlan.config?.features?.bnpl || false)
                                                                }
                                                            }
                                                        })
                                                    }}
                                                    className="h-10 rounded-xl bg-white border-slate-200 font-bold text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 font-black uppercase">Add Cap (₹/Day)</Label>
                                                <Input 
                                                    type="number"
                                                    value={editingPlan?.config?.dailyWalletAddLimit ?? ''}
                                                    onChange={(e) => setEditingPlan({
                                                        ...editingPlan,
                                                        config: { ...(editingPlan.config || {}), dailyWalletAddLimit: e.target.value }
                                                    })}
                                                    className="h-10 rounded-xl bg-white border-slate-200 font-bold text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 font-black uppercase">BNPL Cycle (Days)</Label>
                                                <Input 
                                                    type="number"
                                                    value={editingPlan?.config?.bnplCycleDays ?? ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const numVal = parseInt(val) || 0;
                                                        setEditingPlan({
                                                            ...editingPlan,
                                                            config: { 
                                                                ...(editingPlan.config || {}), 
                                                                bnplCycleDays: val,
                                                                features: { 
                                                                    ...(editingPlan.config?.features || {}), 
                                                                    bnpl: numVal > 0 || (parseInt(editingPlan.config?.bnplLimit) || 0) > 0 ? true : (editingPlan.config?.features?.bnpl || false)
                                                                }
                                                            }
                                                        })
                                                    }}
                                                    className="h-10 rounded-xl bg-white border-slate-200 font-bold text-slate-700"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 font-black uppercase">Comm. Multiplier</Label>
                                                <Input 
                                                    type="number"
                                                    step="0.1"
                                                    value={editingPlan?.config?.commissionMultiplier ?? ''}
                                                    onChange={(e) => setEditingPlan({
                                                        ...editingPlan,
                                                        config: { ...(editingPlan.config || {}), commissionMultiplier: e.target.value }
                                                    })}
                                                    className="h-10 rounded-xl bg-white border-slate-200 font-bold text-blue-600"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 font-black uppercase">Referral Reward (₹)</Label>
                                                <Input 
                                                    type="number"
                                                    value={editingPlan?.config?.referralReward ?? ''}
                                                    onChange={(e) => setEditingPlan({
                                                        ...editingPlan,
                                                        config: { ...(editingPlan.config || {}), referralReward: e.target.value }
                                                    })}
                                                    className="h-10 rounded-xl bg-white border-slate-200 font-bold text-emerald-600"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-2">
                                            {[
                                                { label: "BNPL Access", key: "bnpl", icon: Landmark },
                                                { label: "Reward Cashback", key: "cashback", icon: Star },
                                                { label: "Priority Support", key: "prioritySupport", icon: ShieldCheck },
                                                { label: "Withdrawal Access", key: "withdrawalAllowed", icon: Building2 },
                                                { label: "Advertising", key: "ads", icon: Activity }
                                            ].map((feature) => (
                                                <div key={feature.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 hover:translate-x-1 transition-transform">
                                                    <div className="flex items-center gap-2">
                                                        <feature.icon className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">{feature.label}</span>
                                                    </div>
                                                    <Switch 
                                                        checked={editingPlan?.config?.features?.[feature.key] || false}
                                                        onCheckedChange={(v) => setEditingPlan({
                                                            ...editingPlan,
                                                            config: { 
                                                                ...(editingPlan.config || {}), 
                                                                features: { ...(editingPlan.config?.features || {}), [feature.key]: v }
                                                            }
                                                        })}
                                                    />
                                                </div>
                                            ))}
                                            
                                            <div className="flex items-center justify-between py-2 transition-all">
                                                <div className="flex items-center gap-2">
                                                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                                                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">Reward Tier</span>
                                                </div>
                                                <select 
                                                    value={editingPlan?.config?.features?.rewards || 'BASIC'}
                                                    onChange={(e) => setEditingPlan({
                                                        ...editingPlan,
                                                        config: { 
                                                            ...(editingPlan.config || {}), 
                                                            features: { ...(editingPlan.config?.features || {}), rewards: e.target.value }
                                                        }
                                                    })}
                                                    className="h-8 bg-white border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest px-2"
                                                >
                                                    <option value="BASIC">Basic</option>
                                                    <option value="PREMIUM">Premium</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Full Width Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4 border-t border-slate-100">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Public Description</Label>
                                <Textarea 
                                    value={editingPlan?.description || ""} 
                                    onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                                    className="h-32 rounded-[24px] bg-slate-50 border-slate-200 resize-none text-sm font-medium leading-relaxed p-5 focus:ring-2 focus:ring-blue-500/10"
                                    placeholder="Briefly describe the focus of this plan..."
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Highlights</Label>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={handleAddFeature}
                                        className="h-7 text-[10px] font-black text-blue-600 hover:bg-blue-50 uppercase"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add Highlight
                                    </Button>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto pr-3 custom-scrollbar">
                                    {editingPlan?.features.map((feature: string, idx: number) => (
                                        <div key={idx} className="flex gap-2 group">
                                            <Input 
                                                value={feature}
                                                onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                                                className="h-10 text-xs rounded-xl border-slate-200 bg-slate-50/50"
                                                placeholder="Enter highlight..."
                                            />
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                onClick={() => handleRemoveFeature(idx)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 p-6 flex gap-3 sm:gap-0 mt-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setEditingPlan(null)}
                            className="rounded-xl font-bold text-slate-500 hover:bg-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            disabled={saving}
                            className="rounded-xl font-bold bg-blue-600 hover:bg-blue-700 min-w-[120px] shadow-lg shadow-blue-600/20"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {!plans.length && (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                        <h3 className="font-bold text-amber-900">Setup Required</h3>
                        <p className="text-sm text-amber-700 mt-1">
                            The dynamic plans feature requires a 'plans' table in your Supabase database. 
                            Please run the provided SQL migration script to enable this feature.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanManager;
