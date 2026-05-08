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
   * Helper to handle response errors robustly
   */
  async handleResponseError(response: Response, defaultMessage: string): Promise<never> {
    const text = await response.text();
    const contentType = response.headers.get('content-type');
    
    let message = defaultMessage;
    
    // Check if response is HTML (Cloudflare/Nginx error pages)
    if (
      (contentType && contentType.includes('text/html')) || 
      text.trim().startsWith('<!DOCTYPE') || 
      text.includes('<html') || 
      text.includes('<div')
    ) {
      if (response.status === 502) {
        message = 'Server is currently undergoing maintenance (502). Please try again in 1-2 minutes.';
      } else if (response.status === 503) {
        message = 'Service is temporarily unavailable (503). Please try again later.';
      } else if (response.status === 504) {
        message = 'Gateway timeout (504). The server took too long to respond.';
      } else {
        message = 'Unexpected server response. Please contact support if the issue persists.';
      }
    } else {
      try {
        const err = JSON.parse(text);
        message = err.message || err.error || defaultMessage;
      } catch (e) {
        message = text.substring(0, 100) || defaultMessage;
      }
    }
    
    throw new Error(message);
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
      return this.handleResponseError(response, 'Failed to create UPI intent');
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
      return this.handleResponseError(response, 'Failed to fetch payment status');
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
      return this.handleResponseError(response, 'Failed to create Razorpay order');
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
      return this.handleResponseError(response, 'Payment verification failed');
    }

    return response.json();
  },
};
