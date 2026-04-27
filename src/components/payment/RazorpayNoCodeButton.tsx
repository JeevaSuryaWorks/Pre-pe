import React, { useEffect, useRef } from 'react';

interface RazorpayNoCodeButtonProps {
  buttonId: string;
  className?: string;
}

export const RazorpayNoCodeButton: React.FC<RazorpayNoCodeButtonProps> = ({
  buttonId,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous button if any
    containerRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/payment-button.js';
    script.setAttribute('data-payment_button_id', buttonId);
    script.async = true;

    const form = document.createElement('form');
    form.appendChild(script);

    containerRef.current.appendChild(form);
  }, [buttonId]);

  return (
    <div ref={containerRef} className={`razorpay-embed-container ${className}`} />
  );
};
