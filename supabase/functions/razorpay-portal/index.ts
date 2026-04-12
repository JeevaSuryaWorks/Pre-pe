import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = (globalThis as any).Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = (globalThis as any).Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Razorpay Keys (Using provided test keys as fallbacks for testing)
    const RZP_KEY_ID = (globalThis as any).Deno.env.get('RAZORPAY_KEY_ID') || 'rzp_test_Sca3POCkQk0Loe';
    const RZP_KEY_SECRET = (globalThis as any).Deno.env.get('RAZORPAY_KEY_SECRET') || 'r4u9ezssnkw7cl4aQf8fzQSj';

    if (!RZP_KEY_ID || !RZP_KEY_SECRET) {
      console.warn("Razorpay credentials not fully configured. Using default test keys.");
    }

    const { action, planId, paymentData } = await req.json();

    // Get calling user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing Authorization header");
      throw new Error("Unauthorized");
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth Error:", userError?.message || "User not found");
      throw new Error("Unauthorized");
    }

    // --- CASE 1: CREATE ORDER ---
    if (action === 'create_order') {
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) throw new Error("Plan not found");
      if (!plan.price_amount || plan.price_amount <= 0) {
        return new Response(JSON.stringify({ isFree: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Call Razorpay API to create order
      const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);
      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: Math.round(plan.price_amount * 100), // convert to paise
          currency: "INR",
          receipt: `plan_${planId}_${user.id.substring(0, 8)}`,
        })
      });

      const order = await rzpResponse.json();
      if (order.error) throw new Error(order.error.description);

      // Track in database
      await supabase.from('plan_payments').insert({
        user_id: user.id,
        plan_id: planId,
        razorpay_order_id: order.id,
        amount: plan.price_amount,
        status: 'PENDING'
      });

      return new Response(JSON.stringify({ orderId: order.id, amount: order.amount, keyId: RZP_KEY_ID }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- CASE 2: VERIFY PAYMENT ---
    if (action === 'verify_payment') {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

      // Logic for HMAC verification (simplified for Deno)
      // For maximum security in production, use a standard HMAC crypto library.
      // Deno example using SubtleCrypto:
      const encoder = new TextEncoder();
      const secretKeyData = encoder.encode(RZP_KEY_SECRET);
      const key = await crypto.subtle.importKey(
        "raw",
        secretKeyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );
      const signaturePayload = `${razorpay_order_id}|${razorpay_payment_id}`;
      const signed = await crypto.subtle.sign("HMAC", key, encoder.encode(signaturePayload));
      const expectedSignature = Array.from(new Uint8Array(signed))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      if (expectedSignature !== razorpay_signature) {
        throw new Error("Invalid payment signature. Potential tampering detected.");
      }

      // Update payment record
      await supabase.from('plan_payments')
        .update({ status: 'COMPLETED', razorpay_payment_id, razorpay_signature, updated_at: new Date().toISOString() })
        .eq('razorpay_order_id', razorpay_order_id);

      // CRITICAL: Upgrade Profile
      const { data: currentPayment, error: fetchError } = await supabase.from('plan_payments').select('plan_id').eq('razorpay_order_id', razorpay_order_id).single();
      
      if (fetchError || !currentPayment) {
        throw new Error("Payment record not found. Could not upgrade profile.");
      }

      await supabase.from('users')
        .update({ plan_type: currentPayment.plan_id })
        .eq('id', user.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error("Invalid action");

  } catch (error) {
    const isAuthError = (error as Error).message === "Unauthorized";
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: isAuthError ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
