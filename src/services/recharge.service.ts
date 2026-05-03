import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse, RechargeRequest, Transaction } from '@/types/recharge.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Process a recharge request through the backend
 */
export async function processRecharge(
  userId: string,
  request: RechargeRequest
): Promise<ApiResponse<Transaction | null>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${API_BASE_URL}/recharge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        status: 'FAILED',
        transaction_id: '',
        message: data.message || 'Recharge failed',
        data: null,
      };
    }

    return {
      status: data.success ? 'SUCCESS' : (data.status === 'PENDING' ? 'PENDING' : 'FAILED'),
      transaction_id: data.transaction_id || '',
      message: data.message || 'Success',
      data: data as unknown as Transaction,
    };
  } catch (error) {
    console.error('Recharge error:', error);
    return {
      status: 'FAILED',
      transaction_id: '',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    };
  }
}

/**
 * Get transaction history for a user
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 50,
  serviceType?: string
): Promise<Transaction[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    let url = `${API_BASE_URL}/recharge/history?limit=${limit}`;
    if (serviceType) {
      url += `&service_type=${serviceType}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session?.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction history');
    }

    return await response.json();
  } catch (error) {
    console.error('History fetch error:', error);
    return [];
  }
}

/**
 * Fetch bill details for postpaid/utilities
 */
export async function fetchBillDetails(
  operatorId: string,
  number: string,
  userId: string
): Promise<ApiResponse<any>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${API_BASE_URL}/recharge/fetch-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ operator_id: operatorId, number, user_id: userId }),
    });

    return await response.json();
  } catch (error) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: null,
    };
  }
}

/**
 * Process a postpaid bill payment
 */
export async function processPostpaidBill(
  userId: string,
  billDetails: any
): Promise<ApiResponse<Transaction | null>> {
  return processRecharge(userId, {
    amount: billDetails.amount,
    mobile_number: billDetails.mobile_number,
    operator_id: billDetails.operator_id,
  });
}