import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Smartphone, CheckCircle, XCircle, Zap, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/payment.service';
import { motion, AnimatePresence } from 'framer-motion';

type PaymentState = 'idle' | 'processing' | 'verifying' | 'success' | 'failed' | 'manual';

interface AddMoneyProps {
  initialAmount?: string;
  onSuccess?: () => void;
}

export function AddMoney({ initialAmount = '', onSuccess }: AddMoneyProps) {
  const [amount, setAmount] = useState(initialAmount);
  const [state, setState] = useState<PaymentState>('idle');
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

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

  const handleUpiPayment = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast({ title: 'Invalid amount', description: 'Enter at least ₹1', variant: 'destructive' });
      return;
    }

    // If on Desktop, UPI recommendation still uses Razorpay (which supports UPI)
    if (!isMobile) {
      handleRazorpayPayment();
      return;
    }

    setState('processing');
    try {
      console.log('Mobile detected: Attempting UPI intent');
      const { intent_url, reference_id } = await paymentService.createUpiIntent(numAmount);
      setReferenceId(reference_id);
      
      // Redirect to UPI app
      window.location.href = intent_url;
      
      // Start polling
      startPolling(reference_id);
    } catch (error: any) {
      console.warn('UPI Intent failed, falling back to Razorpay:', error);
      // Automatically fallback to Razorpay if UPI intent creation fails
      handleRazorpayPayment();
    }
  };

  const handleRazorpayPayment = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast({ title: 'Invalid amount', description: 'Enter at least ₹1', variant: 'destructive' });
      return;
    }

    setState('processing');
    try {
      const order = await paymentService.createRazorpayOrder(numAmount);
      
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'PrePe Wallet',
        description: 'Wallet Top-up',
        order_id: order.id,
        handler: async (response: any) => {
          setState('verifying');
          try {
            await paymentService.verifyRazorpay({
              ...response,
              amount: numAmount,
            });
            setState('success');
            toast({ title: 'Payment Success', description: `₹${numAmount} added to wallet` });
            if (onSuccess) onSuccess();
          } catch (error: any) {
            setState('failed');
            const msg = error.message?.length > 200 ? 'Verification failed. Please try again.' : error.message;
            toast({ title: 'Verification Failed', description: msg, variant: 'destructive' });
          }
        },
        modal: {
          ondismiss: () => {
            if (state !== 'success') setState('idle');
          }
        },
        theme: {
          color: '#059669', // Emerald 600
        },
        retry: {
          enabled: true,
          max_count: 2,
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      const msg = error.message?.length > 200 ? 'Failed to initiate payment. Please try again later.' : error.message;
      toast({ title: 'Payment Initiation Failed', description: msg, variant: 'destructive' });
      setState('failed');
    }
  };

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
            <h3 className="text-2xl font-black text-slate-900">Success!</h3>
            <p className="text-slate-500 font-medium">₹{amount} added to your account.</p>
          </div>
          <Button onClick={() => { setState('idle'); setAmount(''); }} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black text-lg">
            Return to Dashboard
          </Button>
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
              {/* Primary Payment Method */}
              <div className="relative">
                {isMobile ? (
                  <Button 
                    onClick={handleUpiPayment} 
                    className="w-full h-20 text-xl bg-emerald-600 hover:bg-emerald-700 font-black rounded-[30px] shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 py-8 relative group"
                    disabled={!amount || parseFloat(amount) < 1}
                  >
                    <Smartphone className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start leading-none">
                      <span>Pay via UPI App</span>
                      <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">Instant Activation</span>
                    </div>
                  </Button>
                ) : (
                  <Button 
                    onClick={handleRazorpayPayment} 
                    className="w-full h-20 text-xl bg-emerald-600 hover:bg-emerald-700 font-black rounded-[30px] shadow-2xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 active:scale-95 py-8 relative group"
                    disabled={!amount || parseFloat(amount) < 1}
                  >
                    <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <div className="flex flex-col items-start leading-none">
                      <span>Pay with Razorpay</span>
                      <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">Cards / UPI / Netbanking</span>
                    </div>
                  </Button>
                )}
                <div className="absolute -top-3 right-6 bg-amber-400 text-amber-950 text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white uppercase tracking-tighter animate-bounce z-20">
                  Recommended
                </div>
              </div>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
                <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-300"><span className="bg-white px-3">Alternative Methods</span></div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {isMobile ? (
                  <Button 
                    variant="outline" 
                    onClick={handleRazorpayPayment} 
                    className="w-full h-16 border-2 border-slate-100 rounded-2xl font-black text-slate-600 hover:bg-slate-50 hover:border-emerald-100 transition-all active:scale-95"
                    disabled={!amount || parseFloat(amount) < 1}
                  >
                    <CreditCard className="mr-2 h-5 w-5 text-emerald-500" />
                    Cards / Netbanking
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    onClick={handleUpiPayment} 
                    className="w-full h-16 border-2 border-slate-100 rounded-2xl font-black text-slate-600 hover:bg-slate-50 hover:border-emerald-100 transition-all active:scale-95"
                    disabled={!amount || parseFloat(amount) < 1}
                  >
                    <Smartphone className="mr-2 h-5 w-5 text-emerald-500" />
                    Open UPI App (Mobile only)
                  </Button>
                )}

                <Button 
                  variant="ghost" 
                  onClick={() => setState('manual')} 
                  className="w-full h-14 rounded-2xl font-black text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all text-xs uppercase tracking-widest"
                  disabled={!amount || parseFloat(amount) < 1}
                >
                  Show QR Code / Manual Pay
                </Button>
              </div>

              <div className="flex flex-col items-center gap-2 text-center pt-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Encrypted & Secure Transaction
                </div>
              </div>
            </div>
          ) : state === 'manual' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-center"
            >
              <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-dashed border-slate-200">
                <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mb-4">
                  {/* QR Code Placeholder - In a real app, this would be a generated QR or static image */}
                  <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=bmsmo63811085@barodampay&pn=PrePe&am=${amount}&cu=INR`)}`}
                      alt="Payment QR Code"
                      className="w-full h-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">UPI ID</p>
                  <p className="text-lg font-black text-emerald-600 select-all">bmsmo63811085@barodampay</p>
                </div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-left">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">Instructions:</p>
                <ul className="text-[10px] text-amber-600 font-medium space-y-1 list-disc pl-4">
                  <li>Scan the QR code or pay to the UPI ID above.</li>
                  <li>After payment, wait 1-2 minutes for automatic sync.</li>
                  <li>If balance doesn't update, contact support with screenshot.</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setState('idle')} 
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  Back
                </Button>
                <Button 
                  onClick={() => {
                    setState('verifying');
                    // Start polling even for manual if we have a way to track it, 
                    // but usually manual requires a reference ID.
                    // For now, just let them return.
                    toast({ title: 'Verification Started', description: 'Checking for your payment...' });
                    setTimeout(() => setState('idle'), 5000);
                  }} 
                  className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest"
                >
                  I've Paid
                </Button>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 space-y-6">
              <div className="relative h-20 w-20 mx-auto">
                <Loader2 className="h-20 w-20 text-emerald-600 animate-spin absolute inset-0" />
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
              className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-700 border border-red-100"
            >
              <XCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-wide">Verification failed. Please try again or check your bank app.</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
