import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'create-order':
        return await createOrder(req, res);
      case 'verify-payment':
        return await verifyPayment(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error(`[Razorpay API] Error in ${action}:`, error);
    return res.status(500).json({ error: error.message });
  }
}

async function createOrder(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { amount, currency, receipt, customer_details, notes } = req.body;

  // For International Payments From Indian Customers:
  // customer_details and shipping_address are mandatory in the Order API call
  const options = {
    amount: amount * 100, // amount in smallest currency unit (paise for INR)
    currency: currency || 'INR',
    receipt: receipt || `receipt_${Date.now()}`,
    notes: notes || {},
  };

  // If customer_details provided (required for international flow)
  if (customer_details) {
    options.customer_id = customer_details.customer_id; // Optional if you have it
    options.customer_details = {
      name: customer_details.name,
      email: customer_details.email,
      contact: customer_details.contact,
      shipping_address: customer_details.shipping_address,
      identity: customer_details.identity,
    };
  }

  const order = await razorpay.orders.create(options);
  return res.status(200).json(order);
}

async function verifyPayment(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    user_id,
    metadata
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  const isSignatureValid = expectedSignature === razorpay_signature;

  if (isSignatureValid) {
    // Update database (Supabase)
    if (user_id) {
        const { error } = await supabase
            .from('transactions')
            .insert({
                user_id,
                amount: metadata.amount,
                type: 'DEPOSIT',
                status: 'SUCCESS',
                reference_id: razorpay_order_id,
                api_transaction_id: razorpay_payment_id,
                notes: { ...metadata, razorpay_signature }
            });
        
        if (error) console.error('Database update error:', error);
    }

    return res.status(200).json({ status: 'ok' });
  } else {
    return res.status(400).json({ status: 'invalid_signature' });
  }
}
