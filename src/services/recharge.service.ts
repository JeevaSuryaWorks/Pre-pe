import { supabase } from '@/supabase'

/* =========================================================
   🔐 GET ACCESS TOKEN
========================================================= */
async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('User not authenticated')
  }

  return session.access_token
}

/* =========================================================
   🚀 PROCESS RECHARGE
========================================================= */
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_BASE_URL || "https://api.pre-pe.com";
  if (!url.endsWith("/api")) {
    url = url.endsWith("/") ? url + "api" : url + "/api";
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

/* =========================================================
   🚀 PROCESS RECHARGE
========================================================= */
export async function processRecharge(
  userId: string,
  details: any
) {
  try {
    const token = await getAuthToken()

    const res = await fetch(`${API_BASE_URL}/recharge`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId,
        ...details,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data?.message || 'Recharge failed')
    }

    return data
  } catch (err: any) {
    console.error('Recharge Error:', err)
    throw err
  }
}

/* =========================================================
   📑 FETCH BILL DETAILS
========================================================= */
export async function fetchBillDetails(
  operatorId: string,
  number: string,
  userId: string
) {
  try {
    const token = await getAuthToken()
    const res = await fetch(`${API_BASE_URL}/recharge/fetch-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ operatorId, number, userId }),
    })

    const data = await res.json()
    return data
  } catch (err: any) {
    console.error('Fetch Bill Error:', err)
    return { status: 'FAILED', message: err.message }
  }
}

/* =========================================================
   💳 PROCESS POSTPAID BILL
========================================================= */
export async function processPostpaidBill(
  userId: string,
  billDetails: any
) {
  try {
    const token = await getAuthToken()
    const res = await fetch(`${API_BASE_URL}/recharge/pay-bill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, ...billDetails }),
    })

    const data = await res.json()
    return data
  } catch (err: any) {
    console.error('Bill Payment Error:', err)
    return { status: 'FAILED', message: err.message }
  }
}

export async function getTransactionHistory(
  userId: string,
  limit: number = 5,
  serviceType?: string
) {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching transaction history:', err)
    return []
  }
}