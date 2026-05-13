import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Share2, Download, Home, MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    amount, 
    operator, 
    number, 
    refId, 
    status = "SUCCESS",
    type = "Recharge" 
  } = location.state || {
    amount: "0",
    operator: "Unknown",
    number: "N/A",
    refId: "N/A",
    status: "SUCCESS",
    type: "Recharge"
  };

  const handleShareWhatsApp = () => {
    const text = `*${type} Successful!* ✅\n\n*Amount:* ₹${amount}\n*Number:* ${number}\n*Operator:* ${operator}\n*Ref ID:* ${refId}\n\n_Thank you for using Pre-pe!_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Layout hideHeader>
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 pb-12">
        
        {/* Success Animation */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 12, stiffness: 200 }}
          className="mt-12 mb-6"
        >
          <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
        </motion.div>

        <h1 className="text-2xl font-black text-slate-900 mb-1">{type} Successful!</h1>
        <p className="text-slate-400 font-medium mb-8">Transaction ID: {refId}</p>

        {/* Receipt Card */}
        <div className="w-full max-w-md bg-white rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
          {/* Decorative Cutouts */}
          <div className="absolute top-1/2 -left-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-100 shadow-inner -translate-y-1/2"></div>
          <div className="absolute top-1/2 -right-3 w-6 h-6 bg-slate-50 rounded-full border border-slate-100 shadow-inner -translate-y-1/2"></div>
          
          <div className="p-8 space-y-6">
            <div className="text-center pb-6 border-b border-dashed border-slate-200">
              <span className="text-xs font-black text-slate-300 uppercase tracking-widest block mb-1">TOTAL PAID</span>
              <span className="text-5xl font-black text-slate-900">₹{amount}</span>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Operator</span>
                <span className="font-bold text-slate-800">{operator}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Consumer Number</span>
                <span className="font-bold text-slate-800">{number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Payment Mode</span>
                <span className="font-bold text-blue-600">Wallet</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-black">COMPLETED</span>
              </div>
            </div>

            <div className="pt-6 flex flex-col items-center">
              <img 
                src="/bharat-connect.svg" 
                alt="Bharat Connect" 
                className="h-6 opacity-30 grayscale"
              />
              <p className="text-[10px] text-slate-300 font-bold mt-2 uppercase tracking-tighter">Assured by NPCI Bharat BillPay</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-md mt-8 space-y-3">
          <Button 
            onClick={handleShareWhatsApp}
            className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-lg shadow-lg shadow-green-100 flex gap-2"
          >
            <MessageCircle className="w-6 h-6 fill-white" />
            SHARE ON WHATSAPP
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline"
              className="h-14 rounded-2xl border-slate-200 font-bold text-slate-600 gap-2"
              onClick={() => window.print()}
            >
              <Download className="w-5 h-5" />
              DOWNLOAD
            </Button>
            <Button 
              className="h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold gap-2"
              onClick={() => navigate('/home')}
            >
              <Home className="w-5 h-5" />
              DONE
            </Button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-auto pt-8 flex items-center gap-2 opacity-30 grayscale">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <span className="text-[10px] font-black tracking-widest text-slate-500">100% SECURE TRANSACTION</span>
        </div>

      </div>
    </Layout>
  );
};
