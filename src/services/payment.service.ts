import { supabase } from '@/integrations/supabase/client';

import { API_BASE_URL } from '@/utils/api-config';

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
    console.log(`[PaymentService] Creating Razorpay order for amount: ${amount} at ${API_BASE_URL}/wallet/create-order`);
    const response = await fetch(`${API_BASE_URL}/wallet/create-order`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ amount }),
    });

    console.log(`[PaymentService] Create order response status: ${response.status}`);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[PaymentService] Create order failed: ${text}`);
      let err;
      try {
        err = JSON.parse(text);
      } catch (e) {
        err = { message: text };
      }
      throw new Error(err.message || err.error || 'Failed to create Razorpay order');
    }

    const data = await response.json();
    console.log(`[PaymentService] Create order success:`, data);
    return data;
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
