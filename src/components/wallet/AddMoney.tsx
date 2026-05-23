import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Smartphone, CheckCircle, XCircle, Zap, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { paymentService } from '@/services/payment.service';
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

    if (!referenceId) {
      toast({ 
        title: 'No Transaction Found', 
        description: 'No active reference ID found to verify.', 
        variant: 'destructive' 
      });
      return;
    }

    setState('verifying');
    toast({ 
      title: 'Verifying Payment', 
      description: 'Checking bank ledger database in real-time. Please wait...',
    });

    try {
      const result = await paymentService.getPaymentStatus(referenceId);

      if (result.status === 'SUCCESS') {
        setState('success');
        refetchWallet();
        toast({ 
          title: 'Payment Confirmed', 
          description: `₹${result.amount || amount} successfully added to your wallet!`,
        });
        if (onSuccess) onSuccess();
      } else if (result.status === 'FAILED') {
        setState('failed');
        setFailureMessage(result.failure_message || 'Payment failed. Money was not deducted if your bank says failed.');
        toast({ 
          title: 'Verification Failed', 
          description: 'The bank returned a failure status for this transaction.', 
          variant: 'destructive' 
        });
      } else {
        // PENDING or NOT_FOUND: Real payment not found yet in the DB
        setState('manual');
        toast({ 
          title: 'Payment Pending', 
          description: "We haven't received confirmation from your bank yet. Please ensure the payment was fully completed, wait a moment, and click I've Paid again.",
          variant: 'default' 
        });
      }
    } catch (err) {
      setState('manual');
      toast({ 
        title: 'Verification Error', 
        description: 'Failed to verify transaction status. Please try again in a few seconds.', 
        variant: 'destructive' 
      });
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
              <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-dashed border-slate-200">
                <div className="bg-white p-4 rounded-2xl shadow-sm inline-block mb-4">
                  <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden relative">
                    {manualIntentUrl ? (
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(manualIntentUrl)}`}
                        alt="Payment QR Code"
                        className="w-full h-full"
                      />
                    ) : (
                      <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Scan to Pay ₹{amount}</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-lg font-black text-emerald-600 select-all font-mono">bmsmobiles@barodampay</p>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('bmsmobiles@barodampay');
                        toast({ title: 'UPI ID Copied', description: 'bmsmobiles@barodampay copied to clipboard' });
                      }}
                      className="px-2 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-black uppercase"
                    >
                      Copy
                    </button>
                  </div>
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
                  onClick={handleManualPaymentCompleted}
                  className="flex-[2] h-14 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-100"
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
