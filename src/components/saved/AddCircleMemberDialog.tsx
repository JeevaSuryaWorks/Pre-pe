import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addSavedItem } from '@/services/saved.service';
import { toast } from '@/hooks/use-toast';
import { Loader2, Users, Smartphone, Tv, Lightbulb, Flame, Droplet, Wifi } from 'lucide-react';

interface AddCircleMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const SERVICE_TYPES = [
  { id: 'MOBILE_PREPAID', name: 'Mobile Prepaid', icon: Smartphone },
  { id: 'MOBILE_POSTPAID', name: 'Mobile Postpaid', icon: Smartphone },
  { id: 'DTH', name: 'DTH Recharge', icon: Tv },
  { id: 'ELECTRICITY', name: 'Electricity Bill', icon: Lightbulb },
  { id: 'GAS', name: 'Gas Piped/Cylinder', icon: Flame },
  { id: 'WATER', name: 'Water Bill', icon: Droplet },
  { id: 'BROADBAND', name: 'Broadband/Landline', icon: Wifi },
];

export function AddCircleMemberDialog({ isOpen, onClose, onSuccess, userId }: AddCircleMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    service_type: '',
    account_id: '',
    operator_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.service_type || !formData.account_id) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const result = await addSavedItem({
      user_id: userId,
      category: 'CIRCLE',
      title: formData.title,
      service_type: formData.service_type,
      account_id: formData.account_id,
      operator_name: formData.operator_name || undefined,
    });

    setLoading(false);
    if (result) {
      toast({ title: 'Success', description: `${formData.title} added to your Prepe Circle.` });
      setFormData({ title: '', service_type: '', account_id: '', operator_name: '' });
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl">
        <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Add to Circle</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
                Save family bill details for instant recharges later.
            </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
                <Label htmlFor="nickname" className="text-xs font-bold text-slate-500 ml-1 uppercase">Nickname / Relation</Label>
                <Input 
                    id="nickname"
                    placeholder="e.g. Dad's Phone, Home Electricity"
                    className="h-12 rounded-xl border-slate-200 focus:border-blue-500 px-4"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="service" className="text-xs font-bold text-slate-500 ml-1 uppercase">Service Type</Label>
                <Select value={formData.service_type} onValueChange={(v) => setFormData(prev => ({ ...prev, service_type: v }))}>
                    <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Service" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {SERVICE_TYPES.map(s => (
                            <SelectItem key={s.id} value={s.id} className="rounded-lg py-2">
                                <div className="flex items-center gap-2">
                                    <s.icon className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium text-slate-700">{s.name}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="account" className="text-xs font-bold text-slate-500 ml-1 uppercase">Mobile / Consumer ID</Label>
                <Input 
                    id="account"
                    placeholder="10-digit number or Consumer ID"
                    className="h-12 rounded-xl border-slate-200 focus:border-blue-500 px-4"
                    value={formData.account_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                />
            </div>

            <DialogFooter className="pt-4">
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={onClose}
                    className="flex-1 rounded-xl font-bold text-slate-500"
                >
                    Cancel
                </Button>
                <Button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 rounded-xl bg-slate-900 text-white font-black hover:bg-blue-600 shadow-lg shadow-slate-900/10"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Circle"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
