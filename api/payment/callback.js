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

    // Map KWIK status to our database format
    const paymentStatus = status === 'SUCCESS' ? 'PAID' : 'FAILED';

    const { data, error } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        kwik_pay_id: payid,
        updated_at: new Date().toISOString()
      })
      .eq('id', client_id);

    if (error) {
      console.error('Supabase update error:', error);
      return res.status(200).json({ error: 'Database update failed', details: error.message });
    }

    console.log(`Order ${client_id} successfully updated to ${paymentStatus}`);
    
    // Always return 200 per KWIK requirements
    return res.status(200).json({ success: true, message: 'Callback processed' });
  } catch (error) {
    console.error('Callback handler error:', error);
    // Always return 200 to KWIK even on internal errors
    return res.status(200).json({ error: 'Internal server error', details: error.message });
  }
}
