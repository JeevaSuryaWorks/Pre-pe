import { supabase } from '@/integrations/supabase/client';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  if (!url.endsWith('/api')) {
    url = url.endsWith('/') ? url + 'api' : url + '/api';
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

export interface PaymentStatusResponse {
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'NOT_FOUND';
  amount?: number;
}

export interface UpiIntentResponse {
  success: boolean;
  intent_url: string;
  reference_id: string;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  key: string;
}

/**
 * Payment Service - Handles wallet top-up logic
 */
export const paymentService = {
  /**
   * Helper to get auth headers
   */
  async getHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
    };
  },

  /**
   * Create UPI Intent URL
   */
  async createUpiIntent(amount: number): Promise<UpiIntentResponse> {
    const response = await fetch(`${API_BASE_URL}/wallet/upi-intent`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create UPI intent');
    }

    return response.json();
  },

  /**
   * Poll for payment status
   */
  async getPaymentStatus(referenceId: string): Promise<PaymentStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/wallet/payment-status?reference_id=${referenceId}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment status');
    }

    return response.json();
  },

  /**
   * Create Razorpay Order
   */
  async createRazorpayOrder(amount: number): Promise<RazorpayOrderResponse> {
    const response = await fetch(`${API_BASE_URL}/wallet/create-order`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ amount }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create Razorpay order');
    }

    return response.json();
  },

  /**
   * Verify Razorpay Payment
   */
  async verifyRazorpay(data: any): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/wallet/verify-razorpay`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Payment verification failed');
    }

    return response.json();
  },
};
