import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash, Settings2 } from "lucide-react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const CommissionManager = () => {
    const [slabs, setSlabs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        operator_id: "",
        service_type: "MOBILE_PREPAID",
        commission_type: "PERCENTAGE",
        commission_value: "0",
        min_amount: "0",
        max_amount: "10000"
    });

    useEffect(() => {
        fetchSlabs();
    }, []);

    const fetchSlabs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('commission_slabs')
            .select('*')
            .order('service_type');

        if (error) {
            toast.error("Failed to load commissions");
        } else {
            setSlabs(data || []);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        const payload = {
            operator_id: formData.operator_id || 'ALL', // Simple 'ALL' handling
            service_type: formData.service_type,
            commission_type: formData.commission_type,
            commission_value: Number(formData.commission_value),
            min_amount: Number(formData.min_amount),
            max_amount: Number(formData.max_amount),
            is_active: true
        };

        let error;
        if (editingId) {
            const { error: e } = await supabase.from('commission_slabs').update(payload).eq('id', editingId);
            error = e;
        } else {
            const { error: e } = await supabase.from('commission_slabs').insert(payload);
            error = e;
        }

        if (error) {
            toast.error("Failed to save commission slab");
            console.error(error);
        } else {
            toast.success("Commission Saved");
            setDialogOpen(false);
            fetchSlabs();
            resetForm();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this commission slab?")) return;
        const { error } = await supabase.from('commission_slabs').delete().eq('id', id);
        if (error) toast.error("Delete failed");
        else {
            toast.success("Commission Slab Deleted");
            fetchSlabs();
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            operator_id: "",
            service_type: "MOBILE_PREPAID",
            commission_type: "PERCENTAGE",
            commission_value: "0",
            min_amount: "0",
            max_amount: "10000"
        });
    };

    const openEdit = (slab: any) => {
        setEditingId(slab.id);
        setFormData({
            operator_id: slab.operator_id === 'ALL' ? "" : slab.operator_id,
            service_type: slab.service_type,
            commission_type: slab.commission_type,
            commission_value: slab.commission_value.toString(),
            min_amount: slab.min_amount.toString(),
            max_amount: slab.max_amount.toString()
        });
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">Commission Engine</h2>
                    <p className="text-slate-500 mt-1">Configure automated profit margins for various services.</p>
                </div>
                <Button
                    onClick={() => { resetForm(); setDialogOpen(true); }}
                    className="rounded-xl h-12 px-6 bg-slate-900 text-white hover:bg-blue-600 shadow-lg shadow-slate-900/10 transition-all font-bold group"
                >
                    <Plus className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform" /> Add New Slab
                </Button>
            </div>

            <Card className="border-slate-200/60 shadow-lg bg-white/80 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap">Service Type</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap">Operator ID</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap text-center">Commission Type</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap text-right">Value</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs whitespace-nowrap text-center">Amount Range</TableHead>
                                    <TableHead className="py-4 font-semibold text-slate-500 uppercase text-xs text-right whitespace-nowrap">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
                                                <p>Loading slabs...</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && slabs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-48 text-center text-slate-500 font-medium">
                                            <Settings2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                            No commission slabs configured.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && slabs.map((slab) => (
                                    <TableRow key={slab.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <TableCell className="py-4 font-bold text-slate-800 text-sm">{slab.service_type.replace(/_/g, ' ')}</TableCell>
                                        <TableCell className="py-4">
                                            <div className="inline-flex items-center px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-mono text-xs font-bold whitespace-nowrap">
                                                {slab.operator_id === 'ALL' ? 'ALL OPERATORS' : slab.operator_id}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider ${slab.commission_type === 'PERCENTAGE' ? 'text-blue-700 bg-blue-50' : 'text-purple-700 bg-purple-50'
                                                }`}>
                                                {slab.commission_type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-4 text-right whitespace-nowrap">
                                            <div className={`font-black text-lg ${slab.commission_type === 'PERCENTAGE' ? 'text-blue-600' : 'text-purple-600'}`}>
                                                {slab.commission_type === 'PERCENTAGE' ? `${slab.commission_value}%` : `₹${slab.commission_value}`}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center">
                                            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                                                <span className="text-xs font-bold text-slate-600">₹{parseFloat(slab.min_amount).toLocaleString()}</span>
                                                <span className="w-4 h-px bg-slate-300 mx-1 block" />
                                                <span className="text-xs font-bold text-slate-600">₹{parseFloat(slab.max_amount).toLocaleString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => openEdit(slab)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl" onClick={() => handleDelete(slab.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {/* Fallback for mobile where group-hover might be tricky */}
                                            <div className="md:hidden flex justify-end gap-1 mt-1">
                                                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEdit(slab)}>Edit</Button>
                                                <Button variant="outline" size="sm" className="h-7 text-xs text-rose-600 border-rose-200" onClick={() => handleDelete(slab.id)}>Del</Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[24px] border-none shadow-2xl p-6">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                            <Settings2 className="h-6 w-6 text-slate-400" />
                            {editingId ? 'Edit Configuration' : 'New Commission Slab'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Service Category</Label>
                                <Select value={formData.service_type} onValueChange={(v) => setFormData({ ...formData, service_type: v })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500 font-semibold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl border-slate-200">
                                        <SelectItem value="MOBILE_PREPAID" className="font-semibold py-2">Prepaid Mobile</SelectItem>
                                        <SelectItem value="MOBILE_POSTPAID" className="font-semibold py-2">Postpaid Mobile</SelectItem>
                                        <SelectItem value="DTH" className="font-semibold py-2">DTH Services</SelectItem>
                                        <SelectItem value="WALLET" className="font-semibold py-2">Wallet Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operator Sub-ID</Label>
                                <Input
                                    className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-colors font-medium placeholder:text-slate-400"
                                    placeholder="Leave empty for ALL"
                                    value={formData.operator_id}
                                    onChange={(e) => setFormData({ ...formData, operator_id: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Commission Type</Label>
                                <Select value={formData.commission_type} onValueChange={(v) => setFormData({ ...formData, commission_type: v })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-200 focus:ring-blue-500 font-semibold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-xl shadow-xl border-slate-200">
                                        <SelectItem value="PERCENTAGE" className="font-semibold py-2 text-blue-700 focus:bg-blue-50">Percentage (%)</SelectItem>
                                        <SelectItem value="FLAT" className="font-semibold py-2 text-purple-700 focus:bg-purple-50">Flat (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reward Value</Label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-slate-400 font-bold">{formData.commission_type === 'FLAT' ? '₹' : '%'}</span>
                                    </div>
                                    <Input
                                        type="number"
                                        className="h-12 pl-8 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-colors font-black text-lg text-slate-900"
                                        value={formData.commission_value}
                                        onChange={(e) => setFormData({ ...formData, commission_value: e.target.value })}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-3">
                            <Label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Applicable Transaction Range</Label>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">Min ₹</div>
                                    <Input
                                        type="number"
                                        className="h-10 pl-11 rounded-lg border-slate-200 font-semibold text-slate-800"
                                        value={formData.min_amount}
                                        onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                                        min="0"
                                    />
                                </div>
                                <span className="text-slate-300 font-bold">TO</span>
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">Max ₹</div>
                                    <Input
                                        type="number"
                                        className="h-10 pl-11 rounded-lg border-slate-200 font-semibold text-slate-800"
                                        value={formData.max_amount}
                                        onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="mt-8 gap-3 sm:gap-0">
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-xl font-semibold text-slate-500 h-11 hover:bg-slate-100">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="rounded-xl font-bold h-11 px-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all"
                        >
                            Save Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CommissionManager;
