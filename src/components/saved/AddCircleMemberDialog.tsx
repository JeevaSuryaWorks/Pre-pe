import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addSavedItem } from '@/services/saved.service';
import { toast } from '@/hooks/use-toast';
import { Users, Smartphone, Tv, Lightbulb, Flame, Droplet, Wifi, Calendar } from 'lucide-react';
import { PrePeSpinner } from '@/components/ui/BrandLoader';
import { format } from 'date-fns';
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.service_type || !formData.account_id || !formData.due_date) {
      toast({ title: 'Missing fields', description: 'Please fill all required fields, including the Payment Due Date.', variant: 'destructive' });
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
      metadata: {
        due_date: formData.due_date || null,
        whatsapp_reminder_active: true, // WhatsApp reminder consent is always active (integrated in terms)
      }
    });

    setLoading(false);
    if (result) {
      toast({ title: 'Success', description: `${formData.title} added to your PrePe Family with active alerts.` });
      setFormData({ title: '', service_type: '', account_id: '', operator_name: '', due_date: '' });
      onSuccess();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        
        <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Add to Family</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
                Save family bill details for instant recharges later.
            </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
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

            <div className="space-y-2 flex flex-col">
                <Label htmlFor="due_date" className="text-xs font-bold text-slate-500 ml-1 uppercase">Payment Due Date</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="due_date"
                            variant="outline"
                            type="button"
                            className="h-12 w-full rounded-xl border-slate-200 focus:border-blue-500 px-4 cursor-pointer font-semibold text-slate-700 flex items-center justify-between bg-white text-left hover:bg-white hover:text-slate-700"
                        >
                            <span>
                                {formData.due_date 
                                    ? (() => {
                                        const parts = formData.due_date.split('-');
                                        if (parts.length === 3) {
                                            return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                        }
                                        return format(new Date(formData.due_date), 'dd/MM/yyyy');
                                    })()
                                    : "Select Due Date"
                                }
                            </span>
                            <Calendar className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border border-slate-100 bg-white" align="start">
                        <ShadcnCalendar
                            mode="single"
                            selected={formData.due_date ? (() => {
                                const parts = formData.due_date.split('-');
                                if (parts.length === 3) {
                                    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                                }
                                return new Date(formData.due_date);
                            })() : undefined}
                            onSelect={(date) => {
                                if (date) {
                                    setFormData(prev => ({ ...prev, due_date: format(date, 'yyyy-MM-dd') }));
                                }
                            }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
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
                    {loading ? <PrePeSpinner className="w-4 h-4" /> : "Save to Circle"}
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
