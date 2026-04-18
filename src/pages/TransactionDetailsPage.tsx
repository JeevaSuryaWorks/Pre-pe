import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  ChevronLeft, 
  Share2, 
  Check, 
  Copy, 
  Download, 
  Info, 
  ShieldCheck, 
  PercentCircle,
  HelpCircle,
  FileText
} from "lucide-react";
import { generateInvoice } from "@/utils/invoiceGenerator";
import { ComplaintDialog } from "@/components/transactions/ComplaintDialog";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/types/recharge.types";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TransactionDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [complaintOpen, setComplaintOpen] = useState(false);
    const [transaction, setTransaction] = useState<Transaction | null>(null);

    useEffect(() => {
        if (location.state?.transaction) {
            setTransaction(location.state.transaction);
        } else {
            // Fallback for direct navigation - in a real app this would fetch
            console.warn("Transaction data expected in state");
        }
    }, [id, location.state]);

    if (!transaction) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "Copied", description: `${label} copied to clipboard` });
    };

    const isSuccess = transaction.status === 'SUCCESS';
    const isPending = transaction.status === 'PENDING';

    return (
        <div className="min-h-screen bg-white flex justify-center w-full font-sans select-none">
            <div className="w-full max-w-md bg-[#f8fbfe] min-h-screen flex flex-col relative pb-10">
                {/* Header */}
                <header className="px-4 h-16 flex items-center gap-4 bg-[#f8fbfe]">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full h-10 w-10 bg-[#eef5fe] hover:bg-blue-100 transition-colors" 
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-5 w-5 text-slate-700" />
                    </Button>
                    <h1 className="text-[17px] font-bold text-slate-800 tracking-tight">Transaction Status</h1>
                </header>

                <main className="flex-1 px-5 pt-4 space-y-8 overflow-y-auto">
                    {/* Status Hero */}
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center text-center space-y-3"
                    >
                        <div className="relative">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-[#33c97c] shadow-sm">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                                    className="w-14 h-14 bg-[#33c97c] rounded-full flex items-center justify-center text-white"
                                >
                                    <Check className="w-8 h-8" strokeWidth={4} />
                                </motion.div>
                            </div>
                        </div>
                        
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                {isSuccess ? 'Recharge Successful' : isPending ? 'Recharge Created' : 'Recharge Failed'}
                            </h2>
                            <p className="text-slate-500 text-[13px] font-medium leading-relaxed max-w-[200px] mx-auto">
                                {isSuccess 
                                    ? 'Your request has been successfully done' 
                                    : isPending 
                                        ? 'Your request has been created successfully' 
                                        : 'Something went wrong with your request'
                                }
                            </p>
                        </div>
                    </motion.div>

                    {/* Blue Details Card */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#004bdc] rounded-[2rem] shadow-2xl shadow-blue-200 overflow-hidden text-white pt-10 pb-6 px-6 relative"
                    >
                        {/* Highlights */}
                        <div className="flex flex-col items-center mb-8">
                            <h3 className="text-5xl font-black tracking-tight mb-2">₹{Number(transaction.amount).toFixed(0)}</h3>
                            <p className="text-blue-100 font-bold text-sm tracking-wide uppercase opacity-80">
                                {transaction.service_type === 'MOBILE_PREPAID' ? 'Prepaid Recharge' : transaction.service_type.replace('_', ' ')}
                            </p>
                        </div>

                        {/* Dashed Separator */}
                        <div className="relative h-px w-full overflow-hidden mb-8">
                            <div className="absolute inset-0 w-[200%] h-full border-t border-dashed border-blue-300 opacity-40"></div>
                        </div>

                        {/* Rows */}
                        <div className="space-y-5 text-[14px]">
                            <div className="flex justify-between items-start">
                                <span className="text-blue-200 font-medium">Transaction ID</span>
                                <span className="font-bold text-right max-w-[180px] break-all ml-4" onClick={() => copyToClipboard(transaction.id, 'Transaction ID')}>
                                    {transaction.id}
                                </span>
                            </div>

                            {isSuccess && transaction.reference_id && (
                                <div className="flex justify-between items-start">
                                    <span className="text-blue-200 font-medium">Operator Ref ID</span>
                                    <span className="font-bold break-all text-right ml-4">
                                        {transaction.reference_id}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center">
                                <span className="text-blue-200 font-medium">Payment Method</span>
                                <span className="font-bold uppercase tracking-wider">UPI</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <span className="text-blue-200 font-medium">Date & Time</span>
                                <span className="font-bold">
                                    {format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm:ss')}
                                </span>
                            </div>

                            {/* Cashback Banner */}
                            {isSuccess && Number(transaction.commission) > 0 && (
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                    className="mt-8 bg-[#0039a8] rounded-2xl p-4 flex items-center justify-between group cursor-pointer active:scale-95 transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center">
                                            <PercentCircle className="w-4 h-4 text-blue-300" />
                                        </div>
                                        <p className="text-[13px] font-bold text-blue-50 leading-tight">
                                            ₹{Number(transaction.commission).toFixed(2)} <span className="font-medium text-blue-200 opacity-90 ml-1">Cashback credited to your wallet</span>
                                        </p>
                                    </div>
                                    <div className="w-6 h-6 border border-blue-400/30 rounded-full flex items-center justify-center">
                                        <span className="text-[10px] text-blue-200">%</span>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            className="h-14 bg-[#eef5fe] hover:bg-blue-100 text-[#004bdc] rounded-2xl font-bold flex items-center gap-2 group transition-all"
                            onClick={() => generateInvoice(transaction)}
                        >
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                <FileText className="h-4 w-4" />
                            </div>
                            <span className="text-[14px]">Download Receipt</span>
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-14 bg-[#eef5fe] hover:bg-blue-100 text-[#004bdc] rounded-2xl font-bold flex items-center gap-2 transition-all"
                            onClick={() => setComplaintOpen(true)}
                        >
                            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                                <Info className="h-4 w-4" />
                            </div>
                            <span className="text-[14px]">Need Help?</span>
                        </Button>
                    </div>
                </main>

                <footer className="mt-auto py-8">
                    <div className="flex items-center justify-center gap-2 opacity-40 grayscale group hover:grayscale-0 transition-all">
                        <ShieldCheck className="w-4 h-4 text-slate-800" />
                        <span className="text-[11px] font-bold text-slate-800 tracking-wide">
                            All transactions are secured and protected
                        </span>
                    </div>
                </footer>

                {/* Modals */}
                <ComplaintDialog
                    open={complaintOpen}
                    onOpenChange={setComplaintOpen}
                    transactionId={transaction.id}
                />
            </div>
        </div>
    );
}

