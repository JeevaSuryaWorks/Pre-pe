import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { RazorpayService, RazorpayOptions } from '@/services/RazorpayService';
import { toast } from 'sonner';

interface PaymentButtonProps {
  options: RazorpayOptions;
  onSuccess?: (response: any) => void;
  onError?: (error: any) => void;
  className?: string;
  label?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
  options,
  onSuccess,
  onError,
  className = '',
  label = 'Pay Now'
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const handlePayment = async () => {
    if (loading) return;

    setLoading(true);
    setStatus('processing');

    try {
      await RazorpayService.openCheckout(
        options,
        (response) => {
          setStatus('success');
          setLoading(false);
          toast.success('Payment Successful!');
          if (onSuccess) onSuccess(response);
        },
        (error) => {
          setStatus('error');
          setLoading(false);
          toast.error('Payment Failed or Cancelled');
          if (onError) onError(error);
        }
      );
    } catch (error: any) {
      console.error('Payment error:', error);
      setStatus('error');
      setLoading(false);
      toast.error(error.message || 'Something went wrong');
      if (onError) onError(error);
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handlePayment}
      disabled={loading}
      className={`
        relative flex items-center justify-center gap-2 px-6 py-3 
        bg-gradient-to-r from-blue-600 to-indigo-700 
        hover:from-blue-700 hover:to-indigo-800
        text-white font-semibold rounded-xl shadow-lg 
        transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <motion.div
        initial={false}
        animate={{ rotate: status === 'processing' ? 360 : 0 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        {getIcon()}
      </motion.div>
      <span>{loading ? 'Initializing...' : label}</span>
      
      {/* Subtle glassmorphism overlay on hover */}
      <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
    </motion.button>
  );
};
