import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Receipt,
  CheckCircle,
  Smartphone,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  CreditCard,
  PlusCircle,
  Check,
  Copy,
  QrCode,
  ArrowLeft,
} from 'lucide-react';
import { PrePeSpinner } from '@/components/ui/BrandLoader';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { triggerAutonomousRechargeRewards } from '@/services/rewards.service';
import { QRCodeSVG } from 'qrcode.react';

import {
  fetchBillDetails,
  processPostpaidBill,
} from '@/services/recharge.service';

import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { useKYC } from '@/hooks/useKYC';
import { useToast } from '@/hooks/use-toast';

import { KYCNudgeDialog } from '@/components/kyc/KYCNudgeDialog';
import type { BillDetails } from '@/types/recharge.types';

// Premium high-fidelity postpaid operator configuration with their SVG paths
const POSTPAID_OPERATORS = [
  { id: '14', name: 'Airtel Postpaid', code: 'AIRTEL_POST', logo: '/logos/airtel_new.svg', color: '#eb2f3b', glow: 'shadow-red-500/10 hover:border-red-300' },
  { id: '172', name: 'Jio Postpaid', code: 'JIO_POST', logo: '/logos/jio_new.svg', color: '#002e6e', glow: 'shadow-blue-500/10 hover:border-blue-300' },
  { id: '22', name: 'Vi Postpaid', code: 'VI_POST', logo: '/logos/vi_new.svg', color: '#eb2f3b', glow: 'shadow-rose-500/10 hover:border-rose-300' },
  { id: '29', name: 'BSNL Postpaid', code: 'BSNL_POST', logo: '/logos/bsnl_new.png', color: '#004f9f', glow: 'shadow-sky-500/10 hover:border-sky-300' }
];

export function PostpaidBillForm() {
  const { user } = useAuth();
  const { availableBalance, refetch } = useWallet();
  const { isApproved } = useKYC();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showKYCNudge, setShowKYCNudge] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [billDetails, setBillDetails] = useState<BillDetails | null>(null);
  const [fetchingBill, setFetchingBill] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [showUpiCheckout, setShowUpiCheckout] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  useEffect(() => {
    if (location.state?.mobileNumber && location.state?.operatorId && user) {
      const num = location.state.mobileNumber;
      const op = location.state.operatorId;
      setMobileNumber(num);
      setSelectedOperator(op);
      
      // Auto-trigger fetch bill
      const autoFetch = async () => {
        setFetchingBill(true);
        setBillDetails(null);
        try {
          const result = await fetchBillDetails(op, num, user.id);
          if (result.status === 'SUCCESS' && result.data) {
            setBillDetails(result.data);
            toast({
              title: '✅ Bill Fetched',
              description: `Active bill for ₹${result.data.amount} loaded successfully.`,
            });
          }
        } catch (err) {}
        setFetchingBill(false);
      };
      
      setTimeout(autoFetch, 200);
    } else {
      if (location.state?.mobileNumber) {
        setMobileNumber(location.state.mobileNumber);
      }
      if (location.state?.operatorId) {
        setSelectedOperator(location.state.operatorId);
      }
    }
  }, [location.state, user]);

  /* --------------------------
     Fetch Bill
  --------------------------- */
  const handleFetchBill = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      toast({
        title: 'Invalid mobile number',
        description: 'Enter a valid 10-digit mobile number',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedOperator) {
      toast({
        title: 'Select operator',
        description: 'Please choose an operator first',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to fetch bill',
        variant: 'destructive',
      });
      return;
    }

    setFetchingBill(true);
    setBillDetails(null);

    const result = await fetchBillDetails(
      selectedOperator,
      mobileNumber,
      user.id
    );

    setFetchingBill(false);

    if (result.status === 'SUCCESS' && result.data) {
      setBillDetails(result.data);
      toast({
        title: '✅ Bill Fetched',
        description: `Active bill for ₹${result.data.amount} loaded successfully.`,
      });
    } else {
      toast({
        title: '❌ Failed to fetch bill',
        description: result.message || 'Verification failed. Please check number.',
        variant: 'destructive',
      });
    }
  };

  /* --------------------------
     Pay Bill
  --------------------------- */
  const handlePayBill = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to pay bill',
        variant: 'destructive',
      });
      return;
    }

    if (!isApproved) {
      setShowKYCNudge(true);
      return;
    }

    if (!billDetails) {
      toast({
        title: 'No bill found',
        description: 'Fetch bill details first',
        variant: 'destructive',
      });
      return;
    }

    if (billDetails.amount > availableBalance) {
      toast({
        title: 'Low Balance',
        description: 'Please add money to your wallet to pay this bill.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    const result = await processPostpaidBill(user.id, billDetails);

    setProcessing(false);

    if (result.status === 'SUCCESS' || result.status === 'PENDING') {
      try {
        const isFromFav = location.state?.fromFavorite || false;
        await triggerAutonomousRechargeRewards(user.id, billDetails.amount, isFromFav);
      } catch (rewErr) {
        console.error("Failed to credit autonomous postpaid rewards:", rewErr);
      }
      toast({
        title: '🎉 Payment Successful',
        description: `₹${billDetails.amount} postpaid bill paid successfully!`,
      });

      refetch();
      
      // Navigate to premium receipt view
      navigate('/recharge/receipt', {
        state: {
          amount: billDetails.amount,
          operator: POSTPAID_OPERATORS.find(op => op.id === selectedOperator)?.name || 'Postpaid',
          number: mobileNumber,
          refId: result.transaction_id || ('TXN-' + Math.random().toString(36).substring(7).toUpperCase()),
          type: 'Postpaid Mobile Bill'
        }
      });

      setBillDetails(null);
      setMobileNumber('');
      setSelectedOperator('');
    } else {
      toast({
        title: '❌ Payment Failed',
        description: result.message || 'Insufficient wallet balance or provider offline.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string, type: 'vpa' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'vpa') {
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
    toast({
      title: 'Copied!',
      description: `${text} copied to clipboard`,
    });
  };

  const handlePayBillDirectUpi = async () => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please log in to pay bill',
        variant: 'destructive',
      });
      return;
    }

    if (!isApproved) {
      setShowKYCNudge(true);
      return;
    }

    if (!billDetails) {
      toast({
        title: 'No bill found',
        description: 'Fetch bill details first',
        variant: 'destructive',
      });
      return;
    }

    if (!utrNumber || utrNumber.length !== 12) {
      toast({
        title: 'Invalid UTR Number',
        description: 'UTR must be a 12-digit numeric reference ID.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);

    const result = await processPostpaidBill(user.id, billDetails, utrNumber);

    setProcessing(false);

    if (result.status === 'SUCCESS' || result.status === 'PENDING') {
      try {
        const isFromFav = location.state?.fromFavorite || false;
        await triggerAutonomousRechargeRewards(user.id, billDetails.amount, isFromFav);
      } catch (rewErr) {
        console.error("Failed to credit autonomous postpaid rewards:", rewErr);
      }
      toast({
        title: '🎉 Bill Submitted Successfully',
        description: `Your bill payment of ₹${billDetails.amount} is being processed. UTR: ${utrNumber}`,
      });

      refetch();
      
      // Navigate to premium receipt view
      navigate('/recharge/receipt', {
        state: {
          amount: billDetails.amount,
          operator: POSTPAID_OPERATORS.find(op => op.id === selectedOperator)?.name || 'Postpaid',
          number: mobileNumber,
          refId: utrNumber || result.transaction_id || ('TXN-' + Math.random().toString(36).substring(7).toUpperCase()),
          type: 'Postpaid Mobile Bill'
        }
      });

      setBillDetails(null);
      setMobileNumber('');
      setSelectedOperator('');
      setUtrNumber('');
      setShowUpiCheckout(false);
    } else {
      toast({
        title: '❌ Verification Failed',
        description: result.message || 'The provided UPI UTR is invalid or already used.',
        variant: 'destructive',
      });
    }
  };

  const activeOpDetails = POSTPAID_OPERATORS.find(op => op.id === selectedOperator);
  const isBalanceSufficient = billDetails ? availableBalance >= billDetails.amount : true;

  return (
    <div className="space-y-6">
      {/* STEPS CONTAINER */}
      <Card className="rounded-[30px] border border-slate-150 shadow-sm bg-white overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 select-none">
          <CardTitle className="text-lg font-black uppercase tracking-wider text-slate-800 flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-[#FF671F]" />
            Postpaid Bill Desk
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 space-y-8">
          
          {/* STEP 1: Select Operator Grid */}
          <div className="space-y-4">
            <div className="flex justify-between items-center select-none">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Step 1: Choose Brand</Label>
              {selectedOperator && (
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {POSTPAID_OPERATORS.map((op) => {
                const isSelected = selectedOperator === op.id;
                return (
                  <motion.div
                    key={op.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedOperator(op.id);
                      setBillDetails(null);
                    }}
                    className={cn(
                      "cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-3 transition-all duration-300 shadow-3xs relative overflow-hidden bg-white select-none group",
                      isSelected 
                        ? "border-[#FF671F] bg-[#FF671F]/5 ring-2 ring-[#FF671F]/15" 
                        : "border-slate-150 hover:bg-slate-50/50 hover:shadow-xs",
                      op.glow
                    )}
                  >
                    {/* Visual checkmark inside active card */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-[#FF671F] rounded-full flex items-center justify-center text-white shadow-3xs animate-in zoom-in duration-200">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                    
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center p-1 overflow-hidden transition-transform duration-500 group-hover:scale-110">
                      <img 
                        src={op.logo} 
                        alt={op.name} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 leading-none">
                      {op.name.split(' ')[0]}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Input Field & Submit */}
          <AnimatePresence>
            {selectedOperator && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="space-y-6 pt-4 border-t border-slate-100"
              >
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Step 2: Account Number</Label>
                  <div className="relative">
                    <div className="absolute left-4 top-3.5 flex items-center gap-1.5 text-slate-400 select-none pointer-events-none">
                      <span className="text-xs font-black tracking-widest bg-slate-100 px-2 py-1 rounded-md text-slate-500 border border-slate-200">+91</span>
                    </div>
                    
                    <Input
                      type="tel"
                      maxLength={10}
                      value={mobileNumber}
                      placeholder="Enter postpaid mobile number"
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                      className="h-14 pl-16 text-lg bg-slate-50 border-2 border-slate-200/80 rounded-2xl font-bold focus:ring-2 focus:ring-[#FF671F]/10 focus:border-[#FF671F] focus:bg-white transition-all shadow-3xs"
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 select-none"
                  onClick={handleFetchBill}
                  disabled={fetchingBill || mobileNumber.length !== 10}
                >
                  {fetchingBill ? (
                    <>
                      <PrePeSpinner className="h-4.5 w-4.5" />
                      Securing Bill Statement...
                    </>
                  ) : (
                    <>
                      <Receipt className="h-4.5 w-4.5 shrink-0" />
                      FETCH BILL
                      <ArrowRight className="h-4.5 w-4.5 shrink-0 ml-1 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* BILL DETAILS Glassmorphic Card */}
      <AnimatePresence>
        {billDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -15 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-slate-200 overflow-hidden rounded-[30px] bg-white shadow-xl shadow-slate-950/[0.02]">
              
              {/* Card Header with Tri-color status banner */}
              <div className="bg-slate-900 text-white p-6 relative overflow-hidden select-none">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                      <Receipt className="w-5.5 h-5.5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase tracking-wider leading-none">Bill Statement</h3>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{activeOpDetails?.name || 'Mobile'}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-amber-500/20 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider text-amber-400 rounded-lg shadow-3xs">
                    Pending Dues
                  </span>
                </div>
              </div>

              <CardContent className="p-6 sm:p-8 space-y-6">
                {showUpiCheckout ? (
                  /* BBPS UPI CHECKOUT GATEWAY */
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-100 select-none">
                      <button 
                        onClick={() => setShowUpiCheckout(false)}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                      >
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider">Direct UPI Settle</h4>
                    </div>

                    <div className="space-y-4">
                      {/* Tri-color stripe badge */}
                      <div className="relative rounded-2xl bg-slate-50 border border-slate-150 p-4 space-y-2 select-none text-left">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#FF671F] via-white to-[#046A38]" />
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-slate-400 uppercase tracking-wider">Payee Account</span>
                          <span className="font-black text-slate-800">Jeevasurya Palanisamy</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-slate-400 uppercase tracking-wider">Payee UPI ID</span>
                          <div className="flex items-center gap-1">
                            <span className="font-mono font-black text-indigo-600">s5698564172094253@slc</span>
                            <button 
                              onClick={() => copyToClipboard('s5698564172094253@slc', 'vpa')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-black text-slate-400 uppercase tracking-wider">Exact Amount</span>
                          <div className="flex items-center gap-1">
                            <span className="font-black text-slate-800">₹{billDetails.amount}</span>
                            <button 
                              onClick={() => copyToClipboard(String(billDetails.amount), 'amount')}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* QR code and direct pay link */}
                      <div className="bg-slate-50 border border-slate-150 rounded-2xl p-6 text-center space-y-4">
                        <QRCodeSVG 
                          value={`upi://pay?pa=s5698564172094253@slc&pn=Jeevasurya%20Palanisamy&am=${billDetails.amount}&cu=INR`} 
                          size={160} 
                          className="mx-auto rounded-xl p-2 border border-white bg-white shadow-xs" 
                        />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-normal">
                          Scan using any UPI App to Pay
                        </p>

                        {isMobile && (
                          <a 
                            href={`upi://pay?pa=s5698564172094253@slc&pn=Jeevasurya%20Palanisamy&am=${billDetails.amount}&cu=INR`}
                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all select-none"
                          >
                            <Smartphone className="w-4 h-4" />
                            Pay via UPI App
                          </a>
                        )}
                      </div>

                      {/* Bank Transfer Details Fallback */}
                      <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-200 text-left space-y-3 relative overflow-hidden select-none">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                        <div className="flex items-center justify-between">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Option 2: Direct Bank Transfer (NEFT/IMPS)</h4>
                          <span className="bg-blue-100 text-blue-800 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">Guaranteed</span>
                        </div>
                        
                        <p className="text-[9px] text-slate-500 font-semibold leading-relaxed">
                          If your UPI app blocks instant VPA/Intent payment, add our Slice Current Account as a beneficiary in your bank app to transfer money instantly.
                        </p>

                        <div className="space-y-2 pt-1.5 border-t border-slate-200">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">Beneficiary Name</span>
                            <span className="font-black text-slate-800">Jeevasurya Palanisamy</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">Account Number</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-black text-slate-800">033311501082963</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText('033311501082963');
                                  toast({ title: 'Account Number Copied', description: '033311501082963 copied to clipboard' });
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">Bank IFSC Code</span>
                            <div className="flex items-center gap-1">
                              <span className="font-mono font-black text-indigo-600">NESF0000333</span>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText('NESF0000333');
                                  toast({ title: 'IFSC Code Copied', description: 'NESF0000333 copied to clipboard' });
                                }}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">Alternative IFSC</span>
                            <span className="font-mono font-black text-slate-600">NESF0000096</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">Bank Name</span>
                            <span className="font-black text-slate-800">North East Small Finance Bank</span>
                          </div>
                        </div>
                      </div>

                      {/* Step 2: UTR Reference confirmation */}
                      <div className="space-y-2 text-left">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Step 2: Enter 12-Digit UPI Ref No / UTR</Label>
                        <Input
                          type="text"
                          maxLength={12}
                          placeholder="Enter 12-digit UTR number"
                          value={utrNumber}
                          onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, '').substring(0, 12))}
                          className="h-12 text-center text-lg font-black tracking-widest bg-slate-50 border-2 border-slate-200/80 rounded-xl focus:ring-2 focus:ring-[#FF671F]/10 focus:border-[#FF671F] focus:bg-white transition-all shadow-3xs"
                        />
                        <p className="text-[9px] font-semibold text-slate-400 leading-normal">
                          Submit the 12-digit transaction ID (UTR) after completing your payment to authorize the bill settlement.
                        </p>
                      </div>

                      {/* Authorize buttons */}
                      <Button
                        className="w-full h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-green-600/10 active:scale-98 transition-all flex items-center justify-center gap-2 select-none"
                        disabled={processing || utrNumber.length !== 12}
                        onClick={handlePayBillDirectUpi}
                      >
                        {processing ? (
                          <>
                            <PrePeSpinner className="h-4.5 w-4.5" />
                            Verifying Payment...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
                            VERIFY & SETTLE BILL
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* BILL STATEMENT DUES DISPLAY */
                  <>
                    {/* Statement details grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-5 text-sm pb-6 border-b border-slate-100">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 select-none">Claimant Customer</p>
                        <p className="font-black text-slate-800 leading-tight truncate">{billDetails.customer_name}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 select-none">Account Mobile</p>
                        <p className="font-black text-slate-800 leading-tight truncate">+91 {billDetails.mobile_number}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 select-none">Invoice Serial</p>
                        <p className="font-black text-slate-800 leading-tight truncate">{billDetails.bill_number}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5 select-none">Due Calendar</p>
                        <p className="font-black text-red-500 leading-tight truncate">{billDetails.due_date}</p>
                      </div>
                    </div>

                    {/* Payable Summary */}
                    <div className="bg-slate-50/70 border border-slate-150 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="text-center sm:text-left select-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">PAYABLE AMOUNT</span>
                        <span className="text-xs font-bold text-slate-400 block">Includes dynamic BBPS cess & taxes</span>
                      </div>
                      <span className="font-black text-3xl text-slate-900 leading-none">
                        ₹{Number(billDetails.amount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* BBPS Direct Payment Restriction Alert Banner */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 items-start select-none text-left">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-amber-800">BBPS Payment Rule Alert</p>
                        <p className="text-[11px] text-amber-700/90 font-medium mt-0.5 leading-relaxed">
                          Bharat BillPay (BBPS) guidelines mandate direct transaction-wise payment. Wallet balance cannot be used for this bill.
                        </p>
                      </div>
                    </div>

                    {/* Primary Action Button */}
                    <Button
                      className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2 select-none bg-[#FF671F] hover:bg-[#FF671F]/90 text-white shadow-[#FF671F]/10"
                      onClick={() => setShowUpiCheckout(true)}
                    >
                      <CreditCard className="h-4.5 w-4.5 shrink-0" />
                      PROCEED TO PAY ₹{Number(billDetails.amount).toLocaleString('en-IN')}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <KYCNudgeDialog
        isOpen={showKYCNudge}
        onClose={() => setShowKYCNudge(false)}
        featureName="Postpaid Bill Payment"
      />
    </div>
  );
}