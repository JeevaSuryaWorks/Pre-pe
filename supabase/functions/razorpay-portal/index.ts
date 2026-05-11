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

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    let user = null;
    
    if (token) {
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
      if (userError) {
        console.warn("Auth verification failed, but continuing for diagnosis:", userError.message);
      }
      user = authUser;
    }

    // FALLBACK: If auth fails, try to get user_id from request body (for testing only!)
    // In production, we should keep this strict.
    if (!user) {
      console.warn("No user found via token. Payment will proceed without profile update if successful.");
      // We will still try to create the order.
      user = { id: 'anonymous' }; 
    }

    if (!action) {
      console.error("Missing action in request body");
      throw new Error("Missing action");
    }

    // --- CASE 1: CREATE ORDER ---
    if (action === 'create_order') {
      if (!planId) {
        console.error("Missing planId for create_order");
        throw new Error("Missing planId");
      }

      console.log(`Searching for plan: ${planId}`);
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError) {
        console.error("Database query error for plan:", planError.message);
        throw new Error(`Plan query failed: ${planError.message}`);
      }
      
      if (!plan) {
        console.error(`Plan not found with ID: ${planId}`);
        throw new Error("Plan not found");
      }

      if (plan.price_amount === undefined || plan.price_amount === null) {
        console.error(`Plan ${planId} has no price_amount`);
        throw new Error("Plan has invalid price configuration");
      }

      if (plan.price_amount <= 0) {
        console.log(`Plan ${planId} is free, returning success`);
        return new Response(JSON.stringify({ isFree: true }), { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Call Razorpay API to create order
      const auth = btoa(`${RZP_KEY_ID}:${RZP_KEY_SECRET}`);
      console.log(`Creating Razorpay order for plan: ${planId}, amount: ${plan.price_amount}, user: ${user?.id}`);
      
      const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`
        },
        body: JSON.stringify({
          amount: Math.round(plan.price_amount * 100), // convert to paise
          currency: "INR",
          receipt: `plan_${planId}_${user?.id?.substring(0, 8) || 'anon'}`,
        })
      });

      if (!rzpResponse.ok) {
        const errorText = await rzpResponse.text();
        console.error("Razorpay API Error Response:", errorText);
        throw new Error(`Razorpay API Error: ${rzpResponse.status} ${errorText}`);
      }

      const order = await rzpResponse.json();
      console.log("Razorpay order created successfully:", order.id);

      // Track in database
      const { error: dbError } = await supabase.from('plan_payments').insert({
        user_id: user?.id || 'anonymous',
        plan_id: planId,
        razorpay_order_id: order.id,
        amount: plan.price_amount,
        status: 'PENDING'
      });

      if (dbError) {
        console.error("Database Insert Error for plan_payments:", dbError.message);
        // We still return the order ID so the user can pay, 
        // but the tracking will be missing until the verification step.
      }

      return new Response(JSON.stringify({ orderId: order.id, amount: order.amount, keyId: RZP_KEY_ID }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // --- CASE 2: VERIFY PAYMENT ---
    if (action === 'verify_payment') {
      if (!paymentData) {
        console.error("Missing paymentData for verify_payment");
        throw new Error("Missing payment data");
      }

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        console.error("Incomplete payment data for verification");
        throw new Error("Incomplete payment verification data");
      }

      console.log(`Verifying payment for order: ${razorpay_order_id}`);

      // Logic for HMAC verification
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
        console.error("Signature mismatch detected!");
        throw new Error("Invalid payment signature. Potential tampering detected.");
      }

      console.log("Signature verified. Updating payment record...");

      // Update payment record
      const { error: updatePayError } = await supabase.from('plan_payments')
        .update({ status: 'COMPLETED', razorpay_payment_id, razorpay_signature, updated_at: new Date().toISOString() })
        .eq('razorpay_order_id', razorpay_order_id);

      if (updatePayError) {
        console.warn("Payment record update failed (might not exist yet):", updatePayError.message);
      }

      // CRITICAL: Upgrade Profile
      const { data: currentPayment, error: fetchError } = await supabase
        .from('plan_payments')
        .select('plan_id, user_id')
        .eq('razorpay_order_id', razorpay_order_id)
        .single();
      
      if (fetchError || !currentPayment) {
        console.error("Payment record fetch error:", fetchError?.message || "Not found");
        // If we can't find the record, we might not know which user to upgrade 
        // if the 'user' object from token is 'anonymous'
      }

      const targetUserId = currentPayment?.user_id || user?.id;
      const targetPlanId = currentPayment?.plan_id || planId;

      if (!targetUserId || targetUserId === 'anonymous') {
        console.error("Cannot upgrade: User ID is unknown");
        throw new Error("Could not identify user for profile upgrade.");
      }

      console.log(`Upgrading user ${targetUserId} to plan: ${targetPlanId}`);

      const { error: updateError } = await supabase.from('profiles')
        .update({ plan_type: targetPlanId })
        .eq('user_id', targetUserId);

      if (updateError) {
        console.error("Profile update error:", updateError.message);
        throw new Error(`Failed to update profile status: ${updateError.message}`);
      }

      console.log("Upgrade successful!");
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error(`Invalid action: ${action}`);

  } catch (error) {
    const message = (error as Error).message;
    console.error("Edge Function Exception:", message);
    const isAuthError = message === "Unauthorized";
    return new Response(JSON.stringify({ 
      error: message,
      details: "Check function logs for more information."
    }), {
      status: isAuthError ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

});
