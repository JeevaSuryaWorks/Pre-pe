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
export async function processRecharge({
  amount,
  mobile,
  operator,
}: {
  amount: number
  mobile: string
  operator: string
}) {
  try {
    const token = await getAuthToken()

    const res = await fetch('https://api.pre-pe.com/api/recharge', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, // ✅ REQUIRED
      },
      body: JSON.stringify({
        amount,
        mobile,
        operator,
      }),
    })

    const data = await res.json()

    console.log('Recharge Response:', data)

    if (!res.ok) {
      throw new Error(data?.message || 'Recharge failed')
    }

    return data
  } catch (err: any) {
    console.error('Recharge Error:', err)
    throw err
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