import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // KWIK sends GET requests for callbacks
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { payid, client_id, operator_ref, status } = req.query;

    console.log(`Received KWIK callback for order ${client_id} with status ${status}`);

    // Validate required parameters
    if (!payid || !client_id || !status) {
      console.warn('Missing required parameters in KWIK callback');
      return res.status(200).json({ error: 'Missing required parameters' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials in server environment');
      return res.status(200).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Map KWIK status to our internal states
    // Transactions: SUCCESS, FAILED, PENDING
    // Orders: PAID, FAILED, PENDING
    const isSuccess = status === 'SUCCESS';
    const txnStatus = isSuccess ? 'SUCCESS' : (status === 'FAILED' ? 'FAILED' : 'PENDING');
    const orderStatus = isSuccess ? 'PAID' : (status === 'FAILED' ? 'FAILED' : 'PENDING');

    console.log(`Processing callback for ${client_id}: Status=${status} -> Mapping to Txn:${txnStatus}/Order:${orderStatus}`);

    // 2. Try updating Transactions table (Most likely for recharges)
    // In recharges, reference_id stores the 14-digit Order ID (client_id here)
    const { data: txnData, error: txnError } = await supabase
      .from('transactions')
      .update({
        status: txnStatus,
        api_transaction_id: operator_ref || payid,
        updated_at: new Date().toISOString()
      })
      .eq('reference_id', client_id);

    if (txnError) {
      console.error('Transactions update error:', txnError);
    } else {
      console.log(`Transactions update result for ${client_id}:`, txnData);
    }

    // 3. Try updating Orders table (For backward compatibility or payment collection)
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: orderStatus,
        kwik_pay_id: payid,
        updated_at: new Date().toISOString()
      })
      .eq('id', client_id);

    if (orderError) {
      console.error('Orders update error:', orderError);
    } else {
      console.log(`Orders update result for ${client_id}:`, orderData);
    }
    
    // Always return 200 per KWIK requirements
    return res.status(200).json({ 
      success: true, 
      message: 'Callback processed',
      context: { client_id, status, operator_ref }
    });
  } catch (error) {
    console.error('Callback handler error:', error);
    // Always return 200 to KWIK even on internal errors
    return res.status(200).json({ error: 'Internal server error', details: error.message });
  }
}
