import { useState, useEffect } from "react";
import { adminService } from "@/services/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, Plus, Search, Filter, 
    MoreVertical, Edit2, Trash2, 
    CheckCircle2, XCircle, Gift,
    Shield, Zap, User, Star,
    LayoutList, ArrowRight, ClipboardList,
    Award, Banknote, Target, Wallet,
    TrendingUp, Calendar, Heart, Smartphone,
    ShoppingBag, Tag, Share2, MessageSquare,
    Play, Image, Lock, ShieldCheck,
    HelpCircle
} from "lucide-react";
import { 
    Dialog, DialogContent, DialogHeader, 
    DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { 
    Select, SelectContent, SelectItem, 
    SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const ICONS = [
    { name: 'Gift', icon: Gift },
    { name: 'Shield', icon: Shield },
    { name: 'Zap', icon: Zap },
    { name: 'User', icon: User },
    { name: 'Star', icon: Star },
    { name: 'Award', icon: Award },
    { name: 'Banknote', icon: Banknote },
    { name: 'Target', icon: Target },
    { name: 'Wallet', icon: Wallet },
    { name: 'TrendingUp', icon: TrendingUp },
    { name: 'Calendar', icon: Calendar },
    { name: 'Heart', icon: Heart },
    { name: 'Smartphone', icon: Smartphone },
    { name: 'ShoppingBag', icon: ShoppingBag },
    { name: 'Tag', icon: Tag },
    { name: 'Share2', icon: Share2 },
    { name: 'MessageSquare', icon: MessageSquare },
    { name: 'Play', icon: Play },
    { name: 'Image', icon: Image },
    { name: 'Lock', icon: Lock },
    { name: 'ShieldCheck', icon: ShieldCheck },
    { name: 'LayoutList', icon: LayoutList },
    { name: 'ClipboardList', icon: ClipboardList }
];

const APP_ROUTES = [
    { label: 'Home', value: '/home' },
    { label: 'Rewards Dashboard', value: '/rewards' },
    { label: 'Wallet / Recharge', value: '/wallet' },
    { label: 'KYC Upgrade', value: '/profile/kyc' },
    { label: 'Refer & Earn', value: '/profile/refer' },
    { label: 'Transaction History', value: '/reports/history' },
    { label: 'Services List', value: '/services' },
    { label: 'Subscription Plans', value: '/upgrade' },
    { label: 'Notifications', value: '/notifications' },
    { label: 'Support / Contact', value: '/contact' },
    { label: 'Custom Route', value: 'custom' }
];

const AdminTasks = () => {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [isCustomRoute, setIsCustomRoute] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        reward_points: 0,
        icon_name: "Gift",
        requirement_type: "NONE",
        requirement_value: 0,
        button_text: "GO",
        target_url: "",
        is_active: true
    });

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await adminService.getTasks();
            setTasks(data || []);
        } catch (e) {
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (task: any = null) => {
        if (task) {
            setEditingTask(task);
            setFormData(task);
            const isKnown = APP_ROUTES.some(r => r.value === task.target_url);
            setIsCustomRoute(!isKnown && !!task.target_url);
        } else {
            setEditingTask(null);
            setIsCustomRoute(false);
            setFormData({
                title: "",
                description: "",
                reward_points: 0,
                icon_name: "Gift",
                requirement_type: "NONE",
                requirement_value: 0,
                button_text: "GO",
                target_url: "",
                is_active: true
            });
        }
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.title) {
            toast.error("Title is required");
            return;
        }

        setSaving(true);
        try {
            await adminService.upsertTask(formData);
            toast.success(editingTask ? "Task updated" : "Task created");
            setIsDialogOpen(false);
            fetchTasks();
        } catch (e) {
            toast.error("Failed to save task");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        
        try {
            await adminService.deleteTask(id);
            toast.success("Task deleted");
            fetchTasks();
        } catch (e) {
            toast.error("Failed to delete task");
        }
    };

    const filteredTasks = tasks.filter(t => 
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.requirement_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                <p className="font-bold tracking-widest uppercase text-[10px] animate-pulse">Syncing Task Matrix...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-7xl mx-auto pb-10">
            {/* Header section with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 flex items-center gap-3">
                        <ClipboardList className="w-10 h-10 text-indigo-600" />
                        Task Manager
                    </h2>
                    <p className="text-slate-500 mt-1 font-medium italic">Configure challenges and rewards for building user engagement.</p>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 lg:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                            placeholder="Search tasks..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 h-12 rounded-2xl bg-white border-slate-200 shadow-sm focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <Button 
                        onClick={() => handleOpenDialog()}
                        className="h-12 px-6 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 shadow-xl shadow-slate-900/10 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Task
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                    { label: 'Total Tasks', value: tasks.length, icon: LayoutList, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active', value: tasks.filter(t => t.is_active).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Rewards Pool', value: tasks.reduce((s,t) => s + (t.reward_points || 0), 0), icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Inactive', value: tasks.filter(t => !t.is_active).length, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                 ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white/60 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                <p className="text-xl font-black text-slate-900">{stat.value.toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                 ))}
            </div>

            {/* Task Grid/Table */}
            <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-slate-200/60 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Task Detail</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reward</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Requirement</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredTasks.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <Filter className="w-12 h-12 mb-4" />
                                            <p className="font-bold">No tasks found matching your search</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTasks.map((task) => {
                                    const TaskIcon = ICONS.find(i => i.name === task.icon_name)?.icon || Gift;
                                    return (
                                        <motion.tr 
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="group hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                        <TaskIcon className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 leading-none mb-1">{task.title}</p>
                                                        <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                                                    <span className="font-black text-slate-900">{task.reward_points} PTS</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <Badge variant="outline" className="rounded-full px-3 py-1 font-bold text-[10px] bg-slate-50 border-slate-200 uppercase tracking-wider">
                                                    {task.requirement_type} {task.requirement_value > 0 && `(₹${task.requirement_value})`}
                                                </Badge>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${task.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${task.is_active ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {task.is_active ? 'Live' : 'Paused'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleOpenDialog(task)}
                                                        className="h-10 w-10 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        onClick={() => handleDelete(task.id)}
                                                        className="h-10 w-10 rounded-xl hover:bg-rose-50 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Upsert Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8 border-none bg-white shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                            {editingTask ? 'Modify Task' : 'Define Challenge'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium">
                            Configure how users can earn reward points through interactions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-6 overflow-y-auto max-h-[60vh] custom-scrollbar px-1">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Task Title</Label>
                            <Input 
                                placeholder="e.g., Refer a Friend" 
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</Label>
                            <Input 
                                placeholder="Explain what they need to do..." 
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                className="h-14 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reward (PTS)</Label>
                                <Input 
                                    type="number"
                                    value={formData.reward_points}
                                    onChange={(e) => setFormData({...formData, reward_points: parseInt(e.target.value)})}
                                    className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-black text-lg text-indigo-600"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Visual Icon</Label>
                                <Select 
                                    value={formData.icon_name}
                                    onValueChange={(val) => setFormData({...formData, icon_name: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100">
                                        {ICONS.map(i => (
                                            <SelectItem key={i.name} value={i.name} className="flex items-center gap-2">
                                                <div className="flex items-center gap-3">
                                                    <i.icon className="w-4 h-4 text-indigo-600" />
                                                    {i.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Button Text</Label>
                                <Input 
                                    placeholder="e.g., Verify Now" 
                                    value={formData.button_text}
                                    onChange={(e) => setFormData({...formData, button_text: e.target.value})}
                                    className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Redirect Route</Label>
                                <Select 
                                    value={isCustomRoute ? 'custom' : formData.target_url}
                                    onValueChange={(val) => {
                                        if (val === 'custom') {
                                            setIsCustomRoute(true);
                                            setFormData({...formData, target_url: ""});
                                        } else {
                                            setIsCustomRoute(false);
                                            setFormData({...formData, target_url: val});
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold">
                                        <SelectValue placeholder="Select destination..." />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        {APP_ROUTES.map(r => (
                                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {isCustomRoute && (
                                    <div className="mt-2 animate-in slide-in-from-top-2 duration-300">
                                        <Input 
                                            placeholder="Enter manual path (e.g., /promo)" 
                                            value={formData.target_url}
                                            onChange={(e) => setFormData({...formData, target_url: e.target.value})}
                                            className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logic Type</Label>
                                    <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" />
                                </div>
                                <Select 
                                    value={formData.requirement_type}
                                    onValueChange={(val) => setFormData({...formData, requirement_type: val})}
                                >
                                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                        <SelectItem value="NONE">Manual/Click Only</SelectItem>
                                        <SelectItem value="KYC">KYC Approval Check</SelectItem>
                                        <SelectItem value="RECHARGE">Wallet Recharge Check</SelectItem>
                                        <SelectItem value="REFERRAL">Successful Referral Check</SelectItem>
                                        <SelectItem value="LOGIN">Daily Check-in Check</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Threshold (₹)</Label>
                                    <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" />
                                </div>
                                <Input 
                                    type="number"
                                    disabled={formData.requirement_type === 'NONE' || formData.requirement_type === 'KYC' || formData.requirement_type === 'LOGIN'}
                                    value={formData.requirement_value}
                                    onChange={(e) => setFormData({...formData, requirement_value: parseFloat(e.target.value)})}
                                    className="h-12 rounded-2xl bg-slate-50 border-slate-100 font-bold"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Label className="text-sm font-black text-slate-900 tracking-tight">Status Control</Label>
                                    <HelpCircle className="w-3 h-3 text-slate-300 cursor-help" />
                                </div>
                                <p className="text-[10px] text-slate-500 font-medium">Temporarily disable task without deleting</p>
                            </div>
                            <Switch 
                                checked={formData.is_active}
                                onCheckedChange={(val) => setFormData({...formData, is_active: val})}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-8">
                        <Button 
                            variant="ghost" 
                            onClick={() => setIsDialogOpen(false)}
                            className="h-14 flex-1 rounded-2xl font-bold text-slate-500"
                        >
                            Back
                        </Button>
                        <Button 
                             onClick={handleSave}
                             disabled={saving}
                             className="h-14 flex-1 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-600/20"
                        >
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Logic'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminTasks;
