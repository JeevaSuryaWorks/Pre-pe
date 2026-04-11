import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, Trash2, Zap, Landmark, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

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

    const handleEdit = (plan: any) => {
        setEditingPlan({ 
            ...plan, 
            features_text: plan.features.join('\n') 
        });
    };

    const handleSave = async () => {
        if (!editingPlan) return;
        setSaving(true);
        try {
            const features = editingPlan.features_text.split('\n').filter((f: string) => f.trim() !== '');
            await adminService.updatePlan(editingPlan.id, {
                name: editingPlan.name,
                price: editingPlan.price,
                subtitle: editingPlan.subtitle,
                description: editingPlan.description,
                features: features,
                is_popular: editingPlan.is_popular
            });
            toast.success("Plan updated successfully");
            setEditingPlan(null);
            fetchPlans();
        } catch (e: any) {
            toast.error(e.message || "Failed to update plan");
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
                            <CardTitle className="text-xl font-bold mt-2">{plan.name}</CardTitle>
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

            {editingPlan && (
                <Card className="border-none shadow-2xl bg-white rounded-[24px] overflow-hidden">
                    <CardHeader className="bg-slate-900 text-white p-6">
                        <CardTitle className="text-2xl font-bold">Editing: {editingPlan.name}</CardTitle>
                        <CardDescription className="text-slate-400">Modify the fields below and click save to apply changes globally.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Display Name</Label>
                                    <Input 
                                        value={editingPlan.name} 
                                        onChange={(e) => setEditingPlan({...editingPlan, name: e.target.value})}
                                        className="h-12 rounded-xl border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Price Label (e.g., ₹99/mo)</Label>
                                    <Input 
                                        value={editingPlan.price} 
                                        onChange={(e) => setEditingPlan({...editingPlan, price: e.target.value})}
                                        className="h-12 rounded-xl border-slate-200 font-bold text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Subtitle (Optional)</Label>
                                    <Input 
                                        value={editingPlan.subtitle || ""} 
                                        onChange={(e) => setEditingPlan({...editingPlan, subtitle: e.target.value})}
                                        placeholder="e.g. Shop Owners"
                                        className="h-12 rounded-xl border-slate-200"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <div>
                                        <Label className="font-bold text-slate-700 block">Mark as Most Popular</Label>
                                        <span className="text-xs text-slate-500">Highlights the card on onboarding.</span>
                                    </div>
                                    <Switch 
                                        checked={editingPlan.is_popular}
                                        onCheckedChange={(v) => setEditingPlan({...editingPlan, is_popular: v})}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Description</Label>
                                    <Textarea 
                                        value={editingPlan.description} 
                                        onChange={(e) => setEditingPlan({...editingPlan, description: e.target.value})}
                                        className="h-24 rounded-xl border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Features (One per line)</Label>
                                    <Textarea 
                                        value={editingPlan.features_text} 
                                        onChange={(e) => setEditingPlan({...editingPlan, features_text: e.target.value})}
                                        className="h-40 rounded-xl border-slate-200 font-medium leading-relaxed"
                                        placeholder="Feature 1\nFeature 2..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button 
                                variant="ghost" 
                                onClick={() => setEditingPlan(null)}
                                className="h-12 px-8 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSave} 
                                disabled={saving}
                                className="h-12 px-8 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 min-w-[140px]"
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save Changes</>}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

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
