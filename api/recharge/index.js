import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { number, opid, amount, service_type, user_id, operator_name } = req.body;

    if (!number || !opid || !amount || !service_type || !user_id) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const kwikApiKey = process.env.KWIK_API_KEY;

    if (!supabaseUrl || !supabaseKey || !kwikApiKey) {
      return res.status(500).json({ success: false, error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Generate 14-digit numeric order_id
    const order_id = Date.now().toString().padStart(14, '0');

    // 2. Check wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user_id)
      .single();

    if (walletError || !wallet) {
      return res.status(400).json({ success: false, error: 'Wallet not found' });
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    // 3. Create PENDING transaction
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        type: 'DEBIT',
        service_type,
        amount: parseFloat(amount),
        status: 'PENDING',
        operator_id: opid,
        operator_name,
        mobile_number: service_type === 'MOBILE_RECHARGE' ? number : null,
        dth_id: service_type === 'DTH_RECHARGE' ? number : null,
        reference_id: order_id,
        description: `${service_type} Recharge for ${number}`
      })
      .select()
      .single();

    if (txnError) {
      console.error('Transaction creation error:', txnError);
      return res.status(500).json({ success: false, error: 'Failed to create transaction record' });
    }

    // 4. Call KWIK API (UAT for now)
    const kwikUrl = `https://uat.kwikapi.com/api/v2/recharge.php?api_key=${kwikApiKey}&number=${number}&amount=${amount}&opid=${opid}&order_id=${order_id}&format=JSON`;
    
    let kwikResponse;
    try {
      const response = await fetch(kwikUrl);
      kwikResponse = await response.json();
    } catch (apiError) {
      console.error('KWIK API unreachable:', apiError);
      await supabase.from('transactions').update({ status: 'FAILED', description: 'API Error' }).eq('id', transaction.id);
      return res.status(502).json({ success: false, error: 'Payment gateway timeout' });
    }

    // 5. Success/Failure parsing
    if (kwikResponse.status === 'SUCCESS') {
      // Deduct balance
      const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
      await supabase.from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

      // Ledger entry
      await supabase.from('wallet_ledger').insert({
        wallet_id: wallet.id,
        transaction_id: transaction.id,
        type: 'DEBIT',
        amount: parseFloat(amount),
        balance_after: newBalance,
        description: `Deduction for ${service_type} recharge ${order_id}`
      });

      // Update Txn
      await supabase.from('transactions').update({
        status: 'SUCCESS',
        api_transaction_id: kwikResponse.opr_id,
        updated_at: new Date().toISOString()
      }).eq('id', transaction.id);

      return res.status(200).json({
        success: true,
        data: {
          transaction_id: transaction.id,
          order_id: kwikResponse.order_id,
          operator_ref: kwikResponse.opr_id,
          message: kwikResponse.message || 'Recharge Successful'
        }
      });
    } else {
      const failedStatus = kwikResponse.status === 'PENDING' ? 'PENDING' : 'FAILED';
      await supabase.from('transactions').update({
        status: failedStatus,
        api_transaction_id: kwikResponse.opr_id || null,
        description: kwikResponse.message || 'Transaction Failed',
        updated_at: new Date().toISOString()
      }).eq('id', transaction.id);

      return res.status(400).json({
        success: false,
        status: failedStatus,
        error: kwikResponse.message || 'Recharge failed'
      });
    }

  } catch (error) {
    console.error('Recharge Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
