import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, Trash2, Zap, Landmark, Building2, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
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
            features: [...plan.features] // Clone to avoid direct mutation
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
                is_popular: editingPlan.is_popular
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

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Display Name</Label>
                                    <Input 
                                        value={editingPlan?.name || ""} 
                                        onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Price Label (e.g. "Free", "Contact Us", "₹100/mo")</Label>
                                    <Input 
                                        value={editingPlan?.price || ''} 
                                        onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Subtitle</Label>
                                    <Input 
                                        value={editingPlan?.subtitle || ""} 
                                        onChange={(e) => setEditingPlan({...editingPlan, subtitle: e.target.value})}
                                        className="h-11 rounded-xl bg-slate-50 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-blue-600 uppercase">Payable Amount (INR - set to 0 to make it "Free")</Label>
                                    <Input 
                                        type="number"
                                        value={editingPlan?.price_amount || 0} 
                                        onChange={(e) => setEditingPlan({...editingPlan, price_amount: e.target.value})}
                                        className="h-11 rounded-xl bg-blue-50/30 border-blue-100 font-bold"
                                        placeholder="0"
                                    />
                                    <p className="text-[10px] text-slate-400">This is the actual amount Razorpay will collect.</p>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <Label className="font-bold text-blue-900">Most Popular</Label>
                                    <Switch 
                                        checked={editingPlan?.is_popular || false}
                                        onCheckedChange={(v) => setEditingPlan({...editingPlan, is_popular: v})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Description</Label>
                                    <Textarea 
                                        value={editingPlan?.description || ""} 
                                        onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                                        className="h-24 rounded-xl bg-slate-50 border-slate-200 resize-none"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-500 uppercase">Plan Features</Label>
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={handleAddFeature}
                                            className="h-7 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {editingPlan?.features.map((feature: string, idx: number) => (
                                            <div key={idx} className="flex gap-2">
                                                <Input 
                                                    value={feature}
                                                    onChange={(e) => handleUpdateFeature(idx, e.target.value)}
                                                    className="h-9 text-sm rounded-lg border-slate-200"
                                                    placeholder="Enter feature..."
                                                />
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50"
                                                    onClick={() => handleRemoveFeature(idx)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}

                                        {editingPlan?.features.length === 0 && (
                                            <div className="text-center py-4 text-slate-400 text-xs italic border-2 border-dashed border-slate-100 rounded-xl">
                                                No features added.
                                            </div>
                                        )}
                                    </div>
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
