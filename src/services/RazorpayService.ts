export interface RazorpayOptions {
  amount: number;
  currency: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  customer_details?: {
    name: string;
    email: string;
    contact: string;
    shipping_address: {
      line1: string;
      line2: string;
      city: string;
      country: string;
      state: string;
      zipcode: string;
    };
    identity?: Array<{ type: string; id: string }>;
  };
}

export class RazorpayService {
  private static scriptLoaded = false;

  static loadScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.scriptLoaded) return resolve(true);

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/razorpay.js';
      script.onload = () => {
        this.scriptLoaded = true;
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }

  static async createOrder(options: RazorpayOptions) {
    const response = await fetch('/api/wallet/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create order');
    }

    return response.json();
  }

  static async verifyPayment(paymentData: any) {
    const response = await fetch('/api/wallet/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment verification failed');
    }

    return response.json();
  }

  static async verifySubscription(paymentData: any) {
    const response = await fetch('/api/wallet/subscribe-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Subscription verification failed');
    }

    return response.json();
  }

  static async openCheckout(
    options: RazorpayOptions,
    onSuccess: (response: any) => void,
    onFailure: (response: any) => void
  ) {
    const isLoaded = await this.loadScript();
    if (!isLoaded) {
      throw new Error('Razorpay SDK failed to load. Are you online?');
    }

    const order = await this.createOrder(options);

    const checkoutOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: options.name,
      description: options.description || 'Payment Transaction',
      image: options.image || '/logo.png',
      order_id: order.id,
      handler: async (response: any) => {
        try {
          if (options.notes?.plan_name) {
            await this.verifySubscription({
              ...response,
              plan_name: options.notes.plan_name
            });
          } else {
            await this.verifyPayment({
              ...response,
              amount: options.amount,
              metadata: {
                  amount: options.amount,
                  ...options.notes
              }
            });
          }
          onSuccess(response);
        } catch (error) {
          console.error('Verification error:', error);
          onFailure(error);
        }
      },
      prefill: options.prefill,
      notes: options.notes,
      theme: {
        color: '#3399cc',
      },
    };

    const rzp = new (window as any).Razorpay(checkoutOptions);
    rzp.on('payment.failed', (response: any) => {
      onFailure(response);
    });
    rzp.open();
  }
}
