import { useEffect, useState } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, 
    Save, 
    Gift, 
    Zap, 
    Coins, 
    History, 
    Star, 
    ArrowRight,
    TrendingUp,
    Settings2,
    CheckCircle2,
    Activity
} from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const RewardsManager = () => {
    const [plans, setPlans] = useState<any[]>([]);
    const [globalSettings, setGlobalSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [plansData, settingsData] = await Promise.all([
                adminService.getPlans(),
                adminService.getRewardSettings()
            ]);
            setPlans(plansData || []);
            setGlobalSettings(settingsData || {});
        } catch (e) {
            toast.error("Failed to load reward configurations");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleGlobalSettingChange = (group: string, field: string, value: any) => {
        setGlobalSettings({
            ...globalSettings,
            [group]: {
                ...globalSettings[group],
                [field]: value
            }
        });
    };

    const handleSaveGlobal = async (key: string) => {
        setSaving(true);
        try {
            await adminService.updateRewardSetting(key, globalSettings[key]);
            toast.success("Settings updated successfully");
        } catch (e) {
            toast.error("Failed to update settings");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePlanReward = async (planId: string, multiplier: number) => {
        try {
            const plan = plans.find(p => p.id === planId);
            const newRewardConfig = {
                ...(plan.reward_config || {}),
                points_multiplier: multiplier
            };
            
            await adminService.updatePlan(planId, { 
                reward_config: newRewardConfig 
            });
            
            setPlans(plans.map(p => p.id === planId ? { ...p, reward_config: newRewardConfig } : p));
            toast.success(`${plan.name} rewards updated`);
        } catch (e) {
            toast.error("Failed to update plan reward");
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
                <p className="font-medium animate-pulse">Loading reward engine...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <Gift className="w-10 h-10 text-blue-600" />
                        Rewards Manager
                    </h2>
                    <p className="text-slate-500 mt-2 text-lg font-medium">Fine-tune the platform's gamification and loyalty engine.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center">
                                <Star className="w-4 h-4 text-amber-500 fill-current" />
                            </div>
                        ))}
                    </div>
                    <span className="text-sm font-bold text-slate-600 px-2 uppercase tracking-widest text-[10px]">Active Engine</span>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Sign up Bonus Card */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[32px] overflow-hidden group">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110 duration-500">
                                <Zap className="w-6 h-6" />
                            </div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-3 py-1">REAL-TIME SYNC</Badge>
                        </div>
                        <CardTitle className="text-2xl font-bold mt-6">Welcome Incentives</CardTitle>
                        <CardDescription className="text-slate-500 text-sm font-medium">Configure rewards given to users immediately after account creation.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Signup Bonus (Points)</Label>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Coins className="h-5 w-5 text-amber-500" />
                                </div>
                                <Input 
                                    type="number"
                                    value={globalSettings.signup_bonus?.points || 0}
                                    onChange={(e) => handleGlobalSettingChange('signup_bonus', 'points', parseInt(e.target.value))}
                                    className="h-16 pl-12 rounded-2xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all font-black text-xl text-slate-900"
                                />
                            </div>
                        </div>
                        <Button 
                            className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-blue-600 text-white font-bold transition-all shadow-lg hover:shadow-blue-600/20"
                            onClick={() => handleSaveGlobal('signup_bonus')}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                            Update Welcome Bonus
                        </Button>
                    </CardContent>
                </Card>

                {/* First Recharge Rules */}
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[32px] overflow-hidden group">
                    <CardHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between">
                            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-110 duration-500">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px] tracking-widest uppercase">
                                High Convert <ArrowRight className="w-3 h-3" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold mt-6">Activation Rewards</CardTitle>
                        <CardDescription className="text-slate-500 text-sm font-medium">Rules for the first successful wallet recharge or transaction.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Min. Amount (₹)</Label>
                                <Input 
                                    type="number"
                                    value={globalSettings.first_recharge?.min_amount || 0}
                                    onChange={(e) => handleGlobalSettingChange('first_recharge', 'min_amount', parseInt(e.target.value))}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold text-lg"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Cashback (%)</Label>
                                <Input 
                                    type="number"
                                    value={globalSettings.first_recharge?.cashback_percent || 0}
                                    onChange={(e) => handleGlobalSettingChange('first_recharge', 'cashback_percent', parseInt(e.target.value))}
                                    className="h-14 rounded-2xl bg-indigo-50/50 border-indigo-100 text-indigo-600 font-black text-lg"
                                />
                            </div>
                        </div>
                        <Button 
                            variant="outline"
                            className="w-full h-14 rounded-2xl border-slate-200 hover:border-indigo-600 hover:text-indigo-600 font-bold transition-all"
                            onClick={() => handleSaveGlobal('first_recharge')}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Settings2 className="w-5 h-5 mr-2" />}
                            Save Activation Rules
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Redemption Card */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/70 backdrop-blur-xl rounded-[32px] overflow-hidden">
                <CardHeader className="p-8">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                        <History className="w-6 h-6 text-emerald-600" />
                        Redemption Engine
                    </CardTitle>
                    <CardDescription className="text-slate-500 text-sm font-medium">Control the conversion of reward points back into real wallet balance.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                        <div className="space-y-3 col-span-1">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Min. Points Step</Label>
                            <Input 
                                type="number"
                                value={globalSettings.redemption?.min_points || 1000}
                                onChange={(e) => handleGlobalSettingChange('redemption', 'min_points', parseInt(e.target.value))}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold"
                            />
                            <p className="text-[10px] text-slate-400 font-medium italic">Users can only redeem in multiples of this value.</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-900 rounded-[24px] text-white shadow-xl shadow-slate-900/10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Internal Rate</span>
                            <div className="text-2xl font-black flex items-center gap-2">
                                {globalSettings.redemption?.min_points || 1000} <span className="text-slate-500 font-medium">PTS</span>
                                <ArrowRight className="w-5 h-5 text-emerald-400" />
                                ₹{(globalSettings.redemption?.min_points || 1000) / (globalSettings.redemption?.points_per_rupee || 100)}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">PTS PER ₹1.00</Label>
                            <div className="flex gap-3">
                                <Input 
                                    type="number"
                                    value={globalSettings.redemption?.points_per_rupee || 100}
                                    onChange={(e) => handleGlobalSettingChange('redemption', 'points_per_rupee', parseInt(e.target.value))}
                                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 font-bold text-lg"
                                />
                                <Button 
                                    onClick={() => handleSaveGlobal('redemption')}
                                    className="h-14 w-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                                >
                                    <Save className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plan Specific Multipliers */}
            <div className="space-y-6">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800">Plan-Based Multipliers & Spin Limits</h3>
                    <p className="text-slate-500 font-medium">Amplify rewards and spin limits for users on premium subscription plans.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <Card key={plan.id} className="border-slate-200/60 rounded-[28px] hover:border-blue-500/30 transition-all duration-300 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/[0.02] transition-colors pointer-events-none" />
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                                    <Badge variant="secondary" className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500">{plan.id}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points Multiplier</Label>
                                            <div className="flex items-center gap-1 text-blue-600 font-black text-xs">
                                                <CheckCircle2 className="w-3 h-3" /> Enabled
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input 
                                                type="number"
                                                step="0.1"
                                                value={plan.reward_config?.points_multiplier || 1.0}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setPlans(plans.map(p => p.id === plan.id ? { ...p, reward_config: { ...p.reward_config, points_multiplier: val } } : p));
                                                }}
                                                className="h-10 rounded-xl bg-white border-slate-200 font-black text-blue-600"
                                            />
                                            <Button 
                                                size="sm"
                                                className="rounded-xl h-10 px-4 bg-blue-600 hover:bg-blue-700"
                                                onClick={() => handleUpdatePlanReward(plan.id, plan.reward_config?.points_multiplier || 1.0)}
                                            >
                                                Update
                                            </Button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic px-1">Example: 100 Pts &times; {plan.reward_config?.points_multiplier || 1.0} = {(100 * (plan.reward_config?.points_multiplier || 1.0)).toFixed(0)} Pts</p>
                                    </div>

                                    {/* Spin Wheel Limit */}
                                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Daily Spin Limit</Label>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Input 
                                                type="number"
                                                min="0"
                                                value={globalSettings[`spin_limit_${plan.name.toUpperCase()}`] ?? 1}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setGlobalSettings({
                                                        ...globalSettings,
                                                        [`spin_limit_${plan.name.toUpperCase()}`]: val
                                                    });
                                                }}
                                                className="h-10 rounded-xl bg-white border-indigo-200 font-black text-indigo-600"
                                            />
                                            <Button 
                                                size="sm"
                                                className="rounded-xl h-10 px-4 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20"
                                                onClick={async () => {
                                                    setSaving(true);
                                                    try {
                                                        await adminService.updateRewardSetting(`spin_limit_${plan.name.toUpperCase()}`, globalSettings[`spin_limit_${plan.name.toUpperCase()}`] ?? 1);
                                                        toast.success(`${plan.name} Spin Limit updated`);
                                                    } catch(e) {
                                                        toast.error("Failed to update spin limit");
                                                    } finally {
                                                        setSaving(false);
                                                    }
                                                }}
                                                disabled={saving}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            <Separator className="bg-slate-200/50 my-10" />
            
            <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="max-w-xl">
                        <h4 className="text-2xl font-bold mb-3 flex items-center gap-3">
                             Pro-Tip: Engagement Loops
                        </h4>
                        <p className="text-slate-400 font-medium leading-relaxed">
                            Increasing the <strong>Activation Rewards</strong> typically correlates with a 24% higher retention rate in the first week. We recommend keeping the <strong>Redemption Step</strong> at 1000 points to ensure sustainable liquidity.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Status</span>
                                <span className="font-bold text-sm">Reward Processing Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RewardsManager;
