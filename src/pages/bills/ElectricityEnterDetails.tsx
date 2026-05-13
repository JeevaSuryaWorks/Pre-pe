import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Zap } from "lucide-react";
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";

export const ElectricityEnterDetails = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { availableBalance } = useWallet();
    const { toast } = useToast();

    const operatorId = searchParams.get('operator');
    const [consumerNumber, setConsumerNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [fetchingInfo, setFetchingInfo] = useState(false);
    const [billDetails, setBillDetails] = useState<any>(null);

    const handleFetchBill = async () => {
        if (!consumerNumber) return;
        setFetchingInfo(true);
        // Simulate API call to fetch bill
        setTimeout(() => {
            setBillDetails({
                customerName: "Jeeva Surya",
                dueDate: "25 May 2026",
                amount: "450.00",
                billNumber: "EB-984729"
            });
            setAmount("450.00");
            setFetchingInfo(false);
        }, 1500);
    };

    return (
        <Layout title="Electricity Bill" showBack>
            <div className="bg-slate-50 min-h-screen p-4 space-y-6 relative">
                {/* Bharat Connect Logo */}
                <div className="absolute top-2 right-4 opacity-70">
                    <img 
                        src="/bharat-connect.svg" 
                        alt="Bharat Connect"
                        className="h-6 w-auto grayscale contrast-125" 
                    />
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Electricity Bill</h3>
                            <p className="text-xs text-slate-400 font-medium">{operatorId?.toUpperCase()}</p>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="text-xs font-bold text-slate-400 ml-1 mb-1 block uppercase tracking-wider">Consumer Number</label>
                            <Input
                                placeholder="Enter Consumer Number"
                                className="h-14 text-lg bg-slate-50 border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-100"
                                value={consumerNumber}
                                onChange={(e) => setConsumerNumber(e.target.value)}
                            />
                        </div>
                        
                        <Button 
                            className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-lg shadow-blue-200"
                            onClick={handleFetchBill}
                            disabled={fetchingInfo || !consumerNumber}
                        >
                            {fetchingInfo ? <Loader2 className="animate-spin mr-2" /> : "FETCH BILL"}
                        </Button>
                    </div>
                </div>

                {billDetails && (
                    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                            <span className="text-slate-400 font-medium text-sm">Consumer Name</span>
                            <span className="font-bold text-slate-800">{billDetails.customerName}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                            <span className="text-slate-400 font-medium text-sm">Due Date</span>
                            <span className="font-bold text-red-500">{billDetails.dueDate}</span>
                        </div>
                        <div className="pt-2">
                            <div className="text-center bg-blue-50/50 p-6 rounded-2xl">
                                <span className="text-slate-400 text-xs font-bold block mb-1">PAYABLE AMOUNT</span>
                                <span className="text-4xl font-black text-slate-900">₹{billDetails.amount}</span>
                            </div>
                        </div>
                        
                        <Button 
                            className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-lg shadow-lg shadow-green-100"
                            onClick={() => {
                                toast({ title: "Success", description: "Bill Paid Successfully!" });
                                navigate('/recharge/receipt', { 
                                    state: { 
                                        amount: billDetails.amount, 
                                        operator: operatorId?.toUpperCase() || 'EB', 
                                        number: consumerNumber, 
                                        refId: 'EB-' + Math.random().toString(36).substring(7).toUpperCase(),
                                        type: 'Electricity Bill'
                                    } 
                                });
                            }}
                        >
                            PROCEED TO PAY
                        </Button>
                    </div>
                )}
            </div>
        </Layout>
    );
};
