import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Smartphone, CheckCircle, XCircle, Zap, ShieldCheck, AlertCircle } from 'lucide-react';
import { BrandLoader, PrePeSpinner } from '@/components/ui/BrandLoader';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/payment.service';
import { manualFundService } from '@/services/manualFund.service';
import { bnplService } from '@/services/bnpl.service';
import { motion, AnimatePresence } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useWallet } from '@/hooks/useWallet';
import { Capacitor } from '@capacitor/core';

type PaymentState = 'idle' | 'processing' | 'verifying' | 'success' | 'failed' | 'manual';

interface AddMoneyProps {
  initialAmount?: string;
  onSuccess?: () => void;
}

export function AddMoney({ initialAmount = '', onSuccess }: AddMoneyProps) {
  const { profile } = useProfile();
  const { user } = useAuth();
  const { refetch: refetchWallet } = useWallet();
  const [amount, setAmount] = useState(initialAmount);
  const [state, setState] = useState<PaymentState>('idle');
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [failureMessage, setFailureMessage] = useState<string>('');
  const [manualIntentUrl, setManualIntentUrl] = useState<string>('');
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isManualSuccess, setIsManualSuccess] = useState(false);
  const [selectedUpiVpa, setSelectedUpiVpa] = useState(() => {
    const vpas = ['8668075429@okbizaxis'];
    return vpas[Math.floor(Math.random() * vpas.length)];
  });
  const { toast } = useToast();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // S2S PayU LazyPay State hooks
  const [bnplEligible, setBnplEligible] = useState<boolean | null>(null);
  const [checkingBnpl, setCheckingBnpl] = useState(false);
  const [bnplLinked, setBnplLinked] = useState(false);
  const [bnplOtpRequired, setBnplOtpRequired] = useState(false);
  const [bnplOtpCode, setBnplOtpCode] = useState('');
  const [bnplReferenceId, setBnplReferenceId] = useState('');
  const [bnplOtpError, setBnplOtpError] = useState('');
  const [submittingBnplOtp, setSubmittingBnplOtp] = useState(false);
  const [initiatingBnpl, setInitiatingBnpl] = useState(false);

  // Load Razorpay Script
  useEffect(() => {
    const scriptId = 'razorpay-checkout-js';
    if (document.getElementById(scriptId)) return;

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      // We keep the script globally once loaded to avoid re-loading 
      // and potential race conditions/errors during unmounting
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  }, [pollInterval]);

  const startPolling = useCallback((refId: string) => {
    stopPolling();
    setState('verifying');
    
    const interval = setInterval(async () => {
      try {
        const result = await paymentService.getPaymentStatus(refId);
        if (result.status === 'SUCCESS') {
          setState('success');
          stopPolling();
          toast({ title: 'Payment Success', description: `₹${result.amount} added to wallet` });
          if (onSuccess) onSuccess();
        } else if (result.status === 'FAILED') {
          setState('failed');
          setFailureMessage(result.failure_message || 'Payment failed. Money was not deducted if your bank says failed.');
          stopPolling();
        }
      } catch (error) {
        console.error('Polling error', error);
      }
    }, 4000); 

    setPollInterval(interval as any);
  }, [stopPolling, toast, onSuccess]);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const scriptId = 'razorpay-checkout-js';
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        (existingScript as HTMLScriptElement).onload = () => resolve(true);
        (existingScript as HTMLScriptElement).onerror = () => resolve(false);
        return;
      }
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePrimaryPayment = async () => {
    // Force Razorpay checkout for the primary button on both mobile and desktop.
    // Razorpay securely signs the UPI intents internally, bypassing bank limit & Paytm Protect blocks.
    await handleRazorpayPayment();
  };

  const handleUpiPayment = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast({ title: 'Invalid amount', description: 'Enter at least ₹1', variant: 'destructive' });
      return;
    }

    setState('processing');
    setFailureMessage('');

    try {
      const result = await paymentService.createUpiIntent(numAmount);
      if (result.intent_url) {
        setReferenceId(result.reference_id);
        if (result.upi_vpa) {
          setSelectedUpiVpa(result.upi_vpa);
        }
        
        // Start polling in background to auto-confirm if they complete payment
        startPolling(result.reference_id);
        
        // Automatically display UPI QR Code screen for both mobile and desktop
        setManualIntentUrl(result.intent_url);
        setState('manual');
        return;
      } else {
        throw new Error('UPI Intent URL not generated');
      }
    } catch (error) {
      console.warn('UPI Intent failed, falling back to Razorpay...', error);
      toast({ 
        title: 'UPI Failed', 
        description: 'UPI intent failed. Opening secure Razorpay checkout instead...', 
      });
      await handleRazorpayPayment();
    }
  };

  const handleRazorpayPayment = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast({ title: 'Invalid amount', description: 'Enter at least ₹1', variant: 'destructive' });
      return;
    }

    setState('processing');
    
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      toast({ 
        title: 'SDK Load Error', 
        description: 'Failed to load Razorpay Checkout SDK. Please check your internet connection.', 
        variant: 'destructive' 
      });
      setState('failed');
      return;
    }

    try {
      const order = await paymentService.createRazorpayOrder(numAmount);
      
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'PrePe Wallet',
        description: 'Wallet Top-up',
        order_id: order.id,
        prefill: {
          name: profile?.full_name || '',
          email: profile?.email || '',
          contact: profile?.phone || '',
        },
        handler: async (response: any) => {
          setState('verifying');
          setReferenceId(order.id);
          
          startPolling(order.id);

          try {
            const verifyResult = await paymentService.verifyRazorpay({
              ...response,
              amount: numAmount,
            });
            
            if (verifyResult.success) {
              setState('success');
              stopPolling();
              toast({ title: 'Payment Success', description: `₹${numAmount} added to wallet` });
              if (onSuccess) onSuccess();
            }
          } catch (error: any) {
            console.warn('Initial verification failed, continuing to poll...', error);
          }
        },
        modal: {
          ondismiss: () => {
            if (state !== 'success' && state !== 'verifying') setState('idle');
          }
        },
        theme: {
          color: '#059669',
        },
        retry: {
          enabled: true,
          max_count: 2,
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      const msg = error.message;
      const isMaintenance = msg?.includes('maintenance') || msg?.includes('502') || msg?.includes('Gateway');
      
      console.error('[AddMoney] Initiation error:', error);
      
      toast({ 
        title: isMaintenance ? 'System Maintenance' : 'Payment Initiation Failed', 
        description: isMaintenance 
          ? 'Payment gateways are currently undergoing maintenance. Using Direct UPI/QR fallback instead.' 
          : (msg?.length > 200 ? 'Failed to initiate payment. Please try again later.' : msg), 
        variant: 'destructive' 
      });
      
      if (isMaintenance) {
        setTimeout(() => setState('manual'), 1000);
      } else {
        setState('failed');
      }
    }
  };

  const handleManualPaymentCompleted = async () => {
    if (!user) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }

    const cleanTxnId = transactionId.trim();
    if (!cleanTxnId) {
      toast({ 
        title: 'Transaction ID Required', 
        description: 'Please enter or paste your 12-digit UPI Transaction ID (UTR) to submit.', 
        variant: 'destructive' 
      });
      return;
    }

    if (cleanTxnId.length < 6) {
      toast({ 
        title: 'Invalid Transaction ID', 
        description: 'Please enter a valid Transaction ID / UTR.', 
        variant: 'destructive' 
      });
      return;
    }

    setState('processing');

    try {
      await manualFundService.submitRequest(user.id, parseFloat(amount), cleanTxnId);
      setIsManualSuccess(true);
      setState('success');
      toast({ 
        title: 'Fund Request Submitted', 
        description: `Request for ₹${amount} submitted successfully! Admin will verify UTR: ${cleanTxnId}.`,
      });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setState('manual');
      toast({ 
        title: 'Submission Failed', 
        description: err.message || 'Failed to submit fund request. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  const handleLazyPaySelect = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast({ title: 'Invalid amount', description: 'Enter at least ₹1', variant: 'destructive' });
      return;
    }

    const phone = profile?.phone || user?.phone || '';
    if (!phone) {
      toast({ title: 'Mobile Number Missing', description: 'Please update your mobile number in Profile first.', variant: 'destructive' });
      return;
    }

    setCheckingBnpl(true);
    setBnplEligible(null);
    try {
      const res = await bnplService.checkEligibility(numAmount, phone);
      setBnplEligible(res.eligible);
      setBnplLinked(res.customerLinked);

      if (!res.eligible) {
        toast({ 
          title: 'Not Eligible', 
          description: res.message || 'LazyPay is currently not eligible for this transaction.', 
          variant: 'destructive' 
        });
        return;
      }

      await handleLazyPayPayment(numAmount, phone);
    } catch (err: any) {
      toast({ 
        title: 'Eligibility Check Failed', 
        description: err.message || 'Unable to check LazyPay eligibility.', 
        variant: 'destructive' 
      });
    } finally {
      setCheckingBnpl(false);
    }
  };

  const handleLazyPayPayment = async (numAmount: number, phone: string) => {
    setInitiatingBnpl(true);
    setState('processing');
    setFailureMessage('');

    try {
      const res = await bnplService.initiatePayment(numAmount, phone, 'topup');
      if (res.requiresOtp) {
        setBnplReferenceId(res.referenceId || '');
        setBnplOtpRequired(true);
        setBnplOtpError('');
        setState('idle');
        toast({
          title: 'Linking Required',
          description: res.otpMessage || 'LazyPay sent an OTP to verify your account.'
        });
      } else if (res.success) {
        setState('success');
        toast({
          title: 'Payment Success',
          description: `₹${numAmount} added to wallet via LazyPay 1-Tap checkout.`
        });
        if (onSuccess) onSuccess();
        await refetchWallet();
      }
    } catch (err: any) {
      setState('failed');
      setFailureMessage(err.message || 'Failed to initiate LazyPay payment.');
    } finally {
      setInitiatingBnpl(false);
    }
  };

  const handleVerifyBnplOtp = async () => {
    const cleanOtp = bnplOtpCode.trim();
    if (cleanOtp.length < 6) {
      setBnplOtpError('Please enter a 6-digit OTP code');
      return;
    }

    setSubmittingBnplOtp(true);
    setBnplOtpError('');

    try {
      const res = await bnplService.submitOtp(bnplReferenceId, cleanOtp, parseFloat(amount), user!.id);
      if (res.success) {
        setState('success');
        setBnplOtpRequired(false);
        toast({
          title: 'Account Linked & Cash Added!',
          description: `₹${amount} added successfully to your wallet.`
        });
        if (onSuccess) onSuccess();
        await refetchWallet();
      }
    } catch (err: any) {
      setBnplOtpError(err.message || 'OTP Verification failed');
    } finally {
      setSubmittingBnplOtp(false);
    }
  };

  const fallbackIntentUrl = `upi://pay?pa=${selectedUpiVpa}&pn=${encodeURIComponent('PrePe Technologies')}&am=${amount || '0'}&cu=INR&mode=02`;
  const activeQrUrl = manualIntentUrl || fallbackIntentUrl;

  return (
    <AnimatePresence mode="wait">
      {state === 'success' ? (
        <motion.div 
          key="success"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center p-8 space-y-6"
        >
          <div className="h-24 w-24 bg-emerald-100 rounded-[32px] flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle className="h-12 w-12 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">
              {isManualSuccess ? 'Submitted!' : 'Success!'}
            </h3>
            <p className="text-slate-500 font-medium leading-relaxed">
              {isManualSuccess 
                ? `Request for ₹${amount} is pending admin verification. Funds will be added instantly once verified.`
                : `₹${amount} added to your account.`
              }
            </p>
          </div>
          <Button onClick={() => { setState('idle'); setAmount(''); setTransactionId(''); setIsManualSuccess(false); }} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-lg">
            Return to Dashboard
          </Button>
        </motion.div>
      ) : bnplOtpRequired ? (
        <motion.div 
          key="bnpl-otp"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center bg-orange-50/50 p-6 rounded-[32px] border-2 border-orange-200"
        >
          <div className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xs tracking-tighter">LP</div>
            <div className="text-left">
              <h3 className="text-sm font-black text-orange-900 uppercase tracking-wide">LazyPay Verification</h3>
              <p className="text-[9px] font-bold text-orange-600/70 uppercase tracking-widest mt-0.5 leading-none">OTP Link Consent</p>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              maxLength={6}
              placeholder="Enter 6-digit OTP code"
              value={bnplOtpCode}
              onChange={(e) => setBnplOtpCode(e.target.value.replace(/\D/g, ''))}
              className="h-14 text-center text-2xl font-black border-2 border-orange-200 bg-white rounded-xl focus-visible:ring-orange-500 focus-visible:border-orange-500 font-mono tracking-[0.2em]"
            />
            <p className="text-[10px] text-orange-600/80 leading-snug font-medium text-left">
              ⚠️ PayU Sandbox Mock: LazyPay requires a validation check. Enter <strong>123456</strong> to successfully verify.
            </p>
            {bnplOtpError && (
              <p className="text-xs font-bold text-rose-600 mt-1 flex items-center gap-1 justify-center">
                <AlertCircle className="w-3.5 h-3.5" /> {bnplOtpError}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={() => { setBnplOtpRequired(false); setBnplOtpCode(''); }} 
              variant="outline"
              className="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest border-orange-200 text-orange-700 hover:bg-orange-100"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyBnplOtp}
              disabled={submittingBnplOtp}
              className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 text-white"
            >
              {submittingBnplOtp ? <PrePeSpinner className="h-4 w-4" /> : "Verify & Link"}
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="relative group">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₹</span>
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={state !== 'idle' && state !== 'failed'}
                className="px-12 text-4xl font-black h-24 bg-slate-50 border-none rounded-[28px] focus:ring-4 focus:ring-emerald-50 tabular-nums"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {[500, 1000, 2000].map((val) => (
                <button 
                  key={val} 
                  onClick={() => setAmount(val.toString())}
                  disabled={state !== 'idle' && state !== 'failed'}
                  className="h-14 bg-white border-2 border-slate-50 rounded-2xl text-xs font-black hover:border-emerald-600 hover:text-emerald-600 transition-all active:scale-95 shadow-sm"
                >
                  +₹{val}
                </button>
              ))}
            </div>
          </div>

          {state === 'idle' || state === 'failed' ? (
            <div className="space-y-4">
              {/* 1. Direct UPI / QR Code Button (First, Free) */}
              <div className="relative">
                <Button 
                  onClick={handleUpiPayment} 
                  className="w-full h-20 text-xl bg-emerald-600 hover:bg-emerald-700 font-black rounded-[30px] shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 py-8 relative group"
                  disabled={!amount || parseFloat(amount) < 1}
                >
                  <Smartphone className="w-6 h-6 group-hover:scale-110 transition-transform text-white" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span>Direct UPI / QR Code</span>
                    <span className="text-[10px] opacity-80 font-bold uppercase tracking-widest mt-1 text-emerald-100">0% Extra Fees • Free & Fast</span>
                  </div>
                </Button>
                <div className="absolute -top-3 right-6 bg-amber-400 text-amber-950 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white uppercase tracking-tighter animate-bounce z-20">
                  Popular / Free
                </div>
              </div>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300"><span className="bg-white px-3">Trouble with Direct UPI?</span></div>
              </div>

              {/* 2. Razorpay Gateway Button (Second, 2% Surcharge) */}
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleRazorpayPayment} 
                  className="w-full h-20 border-2 border-slate-100 rounded-[30px] font-black text-slate-700 hover:bg-amber-50/20 hover:border-amber-200 transition-all active:scale-95 flex items-center justify-center gap-3 relative group"
                  disabled={!amount || parseFloat(amount) < 1}
                >
                  <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform text-amber-500" />
                  <div className="flex flex-col items-start leading-none text-left">
                    <span>Pay ₹{amount ? (parseFloat(amount) * 1.02).toFixed(2) : '0'} via Razorpay</span>
                    <span className="text-[10px] opacity-75 font-bold uppercase tracking-widest mt-1 text-amber-600">Includes 2% gateway surcharge</span>
                  </div>
                </Button>

                {/* 3. LazyPay S2S Link & Pay Button - Removed */}

                <div className="flex flex-col items-center gap-2 text-center pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Encrypted & Secure Transaction
                  </div>
                </div>
              </div>
            </div>
          ) : state === 'manual' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              <div className="bg-slate-50 p-4 sm:p-6 rounded-[32px] border-2 border-dashed border-slate-200">
                <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm inline-block mb-3">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative mx-auto">
                    {activeQrUrl ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(activeQrUrl)}`}
                        alt="Payment QR Code"
                        className="w-full h-full"
                      />
                    ) : (
                      <BrandLoader size="md" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Scan to Pay ₹{amount}</p>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <p className="text-sm sm:text-lg font-black text-emerald-600 select-all font-mono">{selectedUpiVpa}</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedUpiVpa);
                        toast({ title: 'UPI ID Copied', description: `${selectedUpiVpa} copied to clipboard` });
                      }}
                      className="px-1.5 py-0.5 sm:px-2 sm:py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[8px] sm:text-[10px] font-black uppercase transition-all"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction ID / UTR Input Field */}
              <div className="space-y-2 text-left bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  UPI Transaction ID / UTR (12 Digits)*
                </Label>
                <Input
                  type="text"
                  placeholder="Enter or paste 12-digit UTR number"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                  className="rounded-2xl border-2 border-slate-200 h-12 px-4 text-sm font-semibold focus:ring-4 focus:ring-emerald-50 focus:border-emerald-500 transition-all font-mono"
                />
                <p className="text-[9px] text-slate-400 leading-tight ml-1 font-medium">
                  * UTR number is printed on your GPay, PhonePe, or Paytm receipt.
                </p>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Instructions:</p>
                <ul className="text-[10px] text-amber-600 font-medium space-y-1 list-disc pl-4">
                  <li>Scan the QR code or pay to the UPI ID above.</li>
                  <li>Paste the 12-digit UPI Transaction ID (UTR) in the box above.</li>
                  <li>Click **I've Paid** to submit your request for instant verification.</li>
                </ul>
              </div>

              <div className="flex gap-2.5 sm:gap-3">
                <Button 
                  onClick={() => { setState('idle'); setTransactionId(''); }} 
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest border-2"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleManualPaymentCompleted}
                  className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100 text-white"
                >
                  I've Paid
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 space-y-6">
              <div className="relative h-20 w-20 mx-auto">
                <BrandLoader size="md" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-emerald-400 fill-current" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="font-black text-2xl text-slate-800">
                  {state === 'processing' ? 'Contacting Bank...' : 'Verifying Payment...'}
                </p>
                <p className="text-sm font-medium text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                  We are waiting for the gateway to confirm your transaction. 
                  Please do not refresh or go back.
                </p>
              </div>
              {(state === 'verifying' || state === 'processing') && (
                <Button 
                  variant="ghost" 
                  onClick={() => setState('idle')} 
                  className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50"
                >
                  Cancel & Restart
                </Button>
              )}
            </div>
          )}

          {state === 'failed' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100"
            >
              <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wide">Verification Failed</p>
                <p className="text-[10px] font-medium leading-relaxed opacity-90">{failureMessage || 'Payment failed. Please try again or check your bank app.'}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button 
                    onClick={() => setState('idle')} 
                    variant="outline" 
                    className="h-9 text-[10px] font-black uppercase tracking-widest border-red-200 text-red-700 hover:bg-red-100 rounded-xl"
                  >
                    Try Again
                  </Button>
                  <Button 
                    onClick={() => setState('manual')} 
                    variant="default" 
                    className="h-9 text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                  >
                    Use Direct UPI Fallback
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
