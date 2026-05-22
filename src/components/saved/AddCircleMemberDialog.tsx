import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { addSavedItem } from '@/services/saved.service';
import { toast } from '@/hooks/use-toast';
import { Loader2, Users, Smartphone, Tv, Lightbulb, Flame, Droplet, Wifi, MessageSquare } from 'lucide-react';

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
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    service_type: '',
    account_id: '',
    operator_name: '',
    due_date: '',
    whatsapp_reminder_active: false,
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
      metadata: {
        due_date: formData.due_date || null,
        whatsapp_reminder_active: formData.whatsapp_reminder_active || false,
      }
    });

    setLoading(false);
    if (result) {
      toast({ title: 'Success', description: `${formData.title} added to your Prepe Circle.` });
      setFormData({ title: '', service_type: '', account_id: '', operator_name: '', due_date: '', whatsapp_reminder_active: false });
      onSuccess();
      onClose();
    }
  };

  const handleWhatsAppToggle = () => {
    const nextVal = !formData.whatsapp_reminder_active;
    if (nextVal && !localStorage.getItem('prepe_whatsapp_consent_seen')) {
      setShowConsentDialog(true);
    } else {
      setFormData(prev => ({ ...prev, whatsapp_reminder_active: nextVal }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-[32px] p-8 border-none shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar relative">
        {/* --- PREMIUM CONSENT OVERLAY --- */}
        {showConsentDialog && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-[32px] z-[70] flex flex-col justify-center p-8 text-center animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="flex flex-col items-center max-w-sm mx-auto space-y-5">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center relative shadow-lg shadow-emerald-500/10">
                <div className="absolute inset-0 bg-emerald-400/20 rounded-2xl blur-md animate-pulse" />
                <MessageSquare className="w-8 h-8 text-emerald-600 fill-emerald-50 relative z-10" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">WhatsApp Alerts Consent</h3>
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  To deliver automated billing alerts, Pre-pe will send helpful payment reminders directly to your WhatsApp when payment due dates arrive. No spam, only essential alerts.
                </p>
              </div>

              <div className="w-full space-y-2.5 pt-2">
                <Button 
                  type="button"
                  onClick={() => {
                    localStorage.setItem('prepe_whatsapp_consent_seen', 'true');
                    setFormData(prev => ({ ...prev, whatsapp_reminder_active: true }));
                    setShowConsentDialog(false);
                    toast({
                      title: "Consent Registered",
                      description: "WhatsApp reminders successfully enabled for your circle."
                    });
                  }}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 uppercase tracking-wider text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  Agree & Enable
                </Button>
                <Button 
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowConsentDialog(false);
                    toast({
                      title: "Alerts Disabled",
                      description: "Consent declined. WhatsApp reminders will not be active.",
                    });
                  }}
                  className="w-full rounded-xl font-bold text-slate-400 hover:text-slate-600 h-10 text-xs"
                >
                  Decline
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogHeader className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
            </div>
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">Add to Circle</DialogTitle>
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

            <div className="space-y-2">
                <Label htmlFor="due_date" className="text-xs font-bold text-slate-500 ml-1 uppercase">Payment Due Date (Optional)</Label>
                <Input 
                    id="due_date"
                    type="date"
                    className="h-12 rounded-xl border-slate-200 focus:border-blue-500 px-4 cursor-pointer font-semibold text-slate-700"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                />
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 ml-1 uppercase">WhatsApp Reminder</Label>
                <div 
                    onClick={handleWhatsAppToggle}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        formData.whatsapp_reminder_active 
                            ? "bg-emerald-50/50 border-emerald-200 text-emerald-800" 
                            : "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                >
                    <div className="flex items-center gap-2.5">
                        <MessageSquare className={`w-5 h-5 shrink-0 ${formData.whatsapp_reminder_active ? "text-emerald-600 fill-emerald-50" : "text-slate-400"}`} />
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black uppercase tracking-wider">Enable WhatsApp Alerts</span>
                            <span className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5">Send alert when due date is arrived</span>
                        </div>
                    </div>
                    <div className={`w-8 h-5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none shrink-0 ${
                        formData.whatsapp_reminder_active ? "bg-emerald-500" : "bg-slate-200"
                    }`}>
                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            formData.whatsapp_reminder_active ? "translate-x-3.5" : "translate-x-0"
                        }`} />
                    </div>
                </div>
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
