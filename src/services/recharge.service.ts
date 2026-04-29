/**
 * src/services/recharge.service.ts
 * COMPLETE FULL UPDATED FILE
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  RechargeRequest,
  ApiResponse,
  Transaction,
  BillDetails,
} from '@/types/recharge.types';

/* =========================================================
   MOBILE / DTH RECHARGE
========================================================= */
export async function processRecharge(
  userId: string,
  request: RechargeRequest
): Promise<ApiResponse<Transaction | null>> {
  try {
    const res = await fetch('https://api.pre-pe.com/recharge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: request.amount,
        mobile:
          request.mobile_number ||
          request.dth_id,
        operator:
          request.operator_id,
      }),
    });

    const data = await res.json();

    console.log(
      '[recharge service] Response:',
      data
    );

    /* ----------------------------
       SUCCESS CASE (NestJS)
    ----------------------------- */
    if (
      data?.id &&
      (data?.status === 'PENDING' ||
        data?.status === 'SUCCESS')
    ) {
      return {
        status:
          data.status as
          | 'PENDING'
          | 'SUCCESS'
          | 'FAILED',
        transaction_id: data.id,
        message:
          data.status === 'PENDING'
            ? 'Recharge initiated successfully'
            : 'Recharge successful',
        data,
      };
    }

    /* ----------------------------
       SUCCESS CASE (legacy)
    ----------------------------- */
    if (data?.success === true) {
      return {
        status:
          (data.status ||
            'SUCCESS') as
          | 'PENDING'
          | 'SUCCESS'
          | 'FAILED',
        transaction_id:
          data.data
            ?.transaction_id || '',
        message:
          data.message ||
          'Recharge successful',
        data:
          data.data || null,
      };
    }

    /* ----------------------------
       FAILED
    ----------------------------- */
    return {
      status: 'FAILED',
      transaction_id: '',
      message:
        data?.error ||
        data?.message ||
        'Recharge failed',
      data,
    };
  } catch (error: any) {
    console.error(
      '[recharge service] Error',
      error
    );

    return {
      status: 'FAILED',
      transaction_id: '',
      message:
        error?.message ||
        'Network error',
      data: null,
    };
  }
}

/* =========================================================
   RECENT TRANSACTION HISTORY
========================================================= */
export async function getTransactionHistory(
  userId: string,
  limit = 5,
  serviceType?: string
) {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', {
        ascending: false,
      })
      .limit(limit);

    if (serviceType) {
      query = query.eq(
        'service_type',
        serviceType
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(error);
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}

/* =========================================================
   TRANSACTION STATUS
========================================================= */
export async function checkTransactionStatus(
  transactionId: string
): Promise<ApiResponse<any>> {
  try {
    const {
      data,
      error,
    } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error || !data) {
      return {
        status: 'FAILED',
        transaction_id:
          transactionId,
        message:
          'Transaction not found',
        data: null,
      };
    }

    return {
      status:
        (data.status ||
          'PENDING') as
        | 'PENDING'
        | 'SUCCESS'
        | 'FAILED',
      transaction_id:
        data.id,
      message:
        'Transaction fetched',
      data,
    };
  } catch {
    return {
      status: 'FAILED',
      transaction_id:
        transactionId,
      message:
        'Unable to fetch transaction',
      data: null,
    };
  }
}
/**
 * ADD THIS FUNCTION inside:
 * src/services/recharge.service.ts
 *
 * Put anywhere above processPostpaidBill()
 */

/* =========================================================
   FETCH BILL DETAILS
========================================================= */
export async function fetchBillDetails(
  operatorId: string,
  mobileNumber: string,
  userId: string
): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(
      'https://api.pre-pe.com/recharge/bill-fetch',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          number: mobileNumber,
          opid: operatorId,
          service_type: 'POSTPAID',
          user_id: userId,
        }),
      }
    );

    const data =
      await res.json();

    if (
      data?.success ||
      data?.status === 'SUCCESS'
    ) {
      return {
        status: 'SUCCESS',
        transaction_id:
          data?.transaction_id || '',
        message:
          data?.message ||
          'Bill fetched',
        data,
      };
    }

    return {
      status: 'FAILED',
      transaction_id: '',
      message:
        data?.message ||
        data?.error ||
        'Unable to fetch bill',
      data,
    };
  } catch (error: any) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message:
        error?.message ||
        'Network error',
      data: null,
    };
  }
}

/* =========================================================
   POSTPAID BILL PAYMENT
========================================================= */
export async function processPostpaidBill(
  userId: string,
  billDetails: BillDetails
): Promise<ApiResponse<any>> {
  try {
    const res = await fetch(
      'https://api.pre-pe.com/recharge',
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          amount:
            billDetails.amount,
          mobile:
            billDetails.mobile_number,
          operator:
            billDetails.operator_id,
        }),
      }
    );

    const data =
      await res.json();

    if (
      data?.id &&
      (data?.status ===
        'SUCCESS' ||
        data?.status ===
        'PENDING')
    ) {
      return {
        status:
          data.status as
          | 'PENDING'
          | 'SUCCESS'
          | 'FAILED',
        transaction_id:
          data.id,
        message:
          'Bill payment initiated',
        data,
      };
    }

    return {
      status: 'FAILED',
      transaction_id: '',
      message:
        data?.error ||
        data?.message ||
        'Bill payment failed',
      data,
    };
  } catch (error: any) {
    return {
      status: 'FAILED',
      transaction_id: '',
      message:
        error?.message ||
        'Network error',
      data: null,
    };
  }
}