import { supabase } from '@/integrations/supabase/client';
import { API_BASE_URL } from '@/utils/api-config';

export interface BnplEligibilityResponse {
  eligible: boolean;
  customerLinked: boolean;
  payuToken?: string;
  kfsLink?: string;
  message?: string;
}

export interface BnplPaymentResponse {
  success: boolean;
  referenceId?: string;
  requiresOtp: boolean;
  otpMessage?: string;
  message?: string;
}

export interface BnplOtpResponse {
  success: boolean;
  message?: string;
  payuToken?: string;
}

export const bnplService = {
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
   * Check eligibility for a phone number for LazyPay S2S
   */
  async checkEligibility(amount: number, phone: string): Promise<BnplEligibilityResponse> {
    const response = await fetch(`${API_BASE_URL}/payu/bnpl/eligibility`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ amount, phone }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to fetch eligibility details');
    }

    return response.json();
  },

  /**
   * Initiate S2S BNPL transaction
   */
  async initiatePayment(amount: number, phone: string, userId: string): Promise<BnplPaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/payu/bnpl/initiate`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ amount, phone, userId }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to initiate BNPL transaction');
    }

    return response.json();
  },

  /**
   * Submit OTP to link first time and capture transaction
   */
  async submitOtp(referenceId: string, otp: string, amount: number, userId: string): Promise<BnplOtpResponse> {
    const response = await fetch(`${API_BASE_URL}/payu/bnpl/submit-otp`, {
      method: 'POST',
      headers: await this.getHeaders(),
      body: JSON.stringify({ referenceId, otp, amount, userId }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to verify OTP');
    }

    return response.json();
  },

  /**
   * Fetch live transaction status
   */
  async getPaymentStatus(referenceId: string): Promise<{ status: 'SUCCESS' | 'FAILED' | 'PENDING' }> {
    const response = await fetch(`${API_BASE_URL}/payu/bnpl/status?referenceId=${referenceId}`, {
      headers: await this.getHeaders(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to retrieve payment status');
    }

    return response.json();
  },
};
