import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const { number, opid, amount, service_type, user_id, operator_name } = req.body;

    // ── Validate all required fields and log what is missing ──
    const missing = [];
    if (!number) missing.push('number');
    if (!opid)   missing.push('opid');
    if (!amount) missing.push('amount');
    if (!service_type) missing.push('service_type');
    if (!user_id) missing.push('user_id');

    if (missing.length > 0) {
      console.error('[recharge] Missing params:', missing, '| body:', req.body);
      return res.status(400).json({ success: false, error: `Missing required parameters: ${missing.join(', ')}` });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const kwikApiKey = process.env.KWIK_API_KEY;

    if (!supabaseUrl || !supabaseKey || !kwikApiKey) {
      console.error('[recharge] Server config missing. SUPABASE_URL?', !!supabaseUrl, 'SERVICE_KEY?', !!supabaseKey, 'KWIK?', !!kwikApiKey);
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
      console.error('[recharge] Wallet lookup failed for user:', user_id, walletError);
      return res.status(400).json({ success: false, error: 'Wallet not found for this user' });
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ success: false, error: `Insufficient balance. Available: \u20b9${wallet.balance}, Requested: \u20b9${amount}` });
    }

    // 3. Create PENDING transaction
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        type: 'RECHARGE',
        service_type,
        amount: parseFloat(amount),
        status: 'PENDING',
        operator_id: opid,
        operator_name: operator_name || opid,
        mobile_number: service_type === 'MOBILE_PREPAID' ? number : null,
        dth_id: service_type === 'DTH' ? number : null,
        reference_id: order_id,
        description: `${service_type} Recharge for ${number}`
      })
      .select()
      .single();

    if (txnError) {
      console.error('[recharge] Transaction creation error:', txnError);
      return res.status(500).json({ success: false, error: 'Failed to create transaction record', detail: txnError.message });
    }

    // ══════════════════════════════════════════════════
    // [DEMO MODE] – Remove this entire block when KWIK account is activated
    // To activate: set DEMO_MODE=true in Vercel environment variables
    // To remove demo: delete everything between the [DEMO MODE] comment markers
    if (process.env.DEMO_MODE === 'true') {
      console.log('[recharge] DEMO MODE active — bypassing KWIK API');
      const newBalance = parseFloat(wallet.balance) - parseFloat(amount);

      // Deduct wallet
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
        description: `[DEMO] ${service_type} Recharge for ${number}`
      });

      // Mark transaction SUCCESS with DEMO prefix
      await supabase.from('transactions').update({
        status: 'SUCCESS',
        reference_id: `DEMO_${order_id}`,
        api_transaction_id: `DEMO_${Date.now()}`,
        description: `[DEMO] ${service_type} Recharge for ${number}`,
        updated_at: new Date().toISOString()
      }).eq('id', transaction.id);

      return res.status(200).json({
        success: true,
        demo: true,
        data: {
          transaction_id: transaction.id,
          order_id: `DEMO_${order_id}`,
          operator_ref: `DEMO_REF`,
          message: '✅ [DEMO] Recharge Successful! (Test mode — no real transaction)'
        }
      });
    }
    // [DEMO MODE] ── End of demo block ──────────────────
    // ══════════════════════════════════════════════════

    // 4. Call KWIK API
    const kwikUrl = `https://www.kwikapi.com/api/v2/recharge.php`;
    const kwikParams = new URLSearchParams({
      api_key: kwikApiKey,
      number: String(number),
      amount: String(amount),
      opid: String(opid),
      order_id: String(order_id),
      format: 'JSON'
    });

    console.log('[recharge] Calling KWIK | opid:', opid, 'number:', number, 'amount:', amount, 'order_id:', order_id);

    let kwikResponse;
    try {
      const response = await fetch(`${kwikUrl}?${kwikParams.toString()}`);
      const rawText = await response.text();
      console.log('[recharge] KWIK raw response:', rawText);
      
      try {
        kwikResponse = JSON.parse(rawText);
      } catch (e) {
        console.error('[recharge] KWIK response is not JSON:', rawText);
        await supabase.from('transactions').update({ status: 'FAILED', description: 'Invalid API response from gateway' }).eq('id', transaction.id);
        return res.status(502).json({ 
          success: false, 
          error: 'Payment gateway returned invalid response format',
          raw: rawText.substring(0, 100)
        });
      }
    } catch (apiError) {
      console.error('[recharge] KWIK API unreachable:', apiError);
      await supabase.from('transactions').update({ status: 'FAILED', description: 'Gateway connection failed' }).eq('id', transaction.id);
      return res.status(502).json({ success: false, error: 'Payment gateway timeout or connection error' });
    }

    console.log('[recharge] KWIK parsed status:', kwikResponse.status, '| message:', kwikResponse.message);

    // 5. Handle KWIK response
    if (kwikResponse.status === 'SUCCESS' || kwikResponse.status === 'SUCCESSFULL') {
      const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
      await supabase.from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

      await supabase.from('wallet_ledger').insert({
        wallet_id: wallet.id,
        transaction_id: transaction.id,
        type: 'DEBIT',
        amount: parseFloat(amount),
        balance_after: newBalance,
        description: `Deduction for ${service_type} recharge ${order_id}`
      });

      await supabase.from('transactions').update({
        status: 'SUCCESS',
        api_transaction_id: kwikResponse.opr_id || kwikResponse.operator_ref,
        updated_at: new Date().toISOString()
      }).eq('id', transaction.id);

      return res.status(200).json({
        success: true,
        data: {
          transaction_id: transaction.id,
          order_id: kwikResponse.order_id || order_id,
          operator_ref: kwikResponse.opr_id || kwikResponse.operator_ref,
          message: kwikResponse.message || 'Recharge Successful'
        }
      });
    } else if (kwikResponse.status === 'PENDING') {
      // PENDING: deduct balance optimistically, will reconcile later
      const newBalance = parseFloat(wallet.balance) - parseFloat(amount);
      await supabase.from('wallets')
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq('id', wallet.id);

      await supabase.from('wallet_ledger').insert({
        wallet_id: wallet.id,
        transaction_id: transaction.id,
        type: 'DEBIT',
        amount: parseFloat(amount),
        balance_after: newBalance,
        description: `Pending deduction for ${service_type} recharge ${order_id}`
      });

      await supabase.from('transactions').update({
        status: 'PENDING',
        api_transaction_id: kwikResponse.opr_id || kwikResponse.operator_ref || null,
        updated_at: new Date().toISOString()
      }).eq('id', transaction.id);

      return res.status(202).json({
        success: true,
        status: 'PENDING',
        data: {
          transaction_id: transaction.id,
          message: kwikResponse.message || 'Recharge is being processed'
        }
      });
    } else {
      // FAILED or ERROR
      console.warn('[recharge] API returned FAILED. Raw response:', kwikResponse);
      
      await supabase.from('transactions').update({
        status: 'FAILED',
        api_transaction_id: kwikResponse.opr_id || kwikResponse.operator_ref || null,
        description: kwikResponse.message || 'Transaction Failed',
        updated_at: new Date().toISOString()
      }).eq('id', transaction.id);

      return res.status(400).json({
        success: false,
        status: 'FAILED',
        error: kwikResponse.message || 'Recharge failed at gateway',
        detail: kwikResponse
      });
    }

  } catch (error) {
    console.error('[recharge] Unexpected Error:', error);
    return res.status(500).json({ success: false, error: 'An unexpected server error occurred during recharge' });
  }
}
