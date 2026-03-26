/**
 * DEBUG ONLY endpoint - shows raw KWIK API response without touching DB
 * Call: POST /api/recharge/test { number, opid, amount }
 * DELETE THIS FILE before going to production
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { number = '9999999999', opid = '1', amount = '10' } = req.body;
  const kwikApiKey = process.env.KWIK_API_KEY;

  if (!kwikApiKey) {
    return res.status(500).json({ error: 'KWIK_API_KEY not set in Vercel env vars' });
  }

  // Fake order_id for test - don't use real money
  const order_id = `TEST${Date.now()}`;

  const kwikUrl = `https://www.kwikapi.com/api/v2/recharge.php`;
  const params = new URLSearchParams({
    api_key: kwikApiKey,
    number: String(number),
    amount: String(amount),
    opid: String(opid),
    order_id,
    format: 'JSON'
  });

  try {
    const response = await fetch(`${kwikUrl}?${params.toString()}`);
    const rawText = await response.text();
    let parsed = null;
    try { parsed = JSON.parse(rawText); } catch(e) {}

    return res.status(200).json({
      kwik_raw: rawText,
      kwik_parsed: parsed,
      url_used: `${kwikUrl}?api_key=REDACTED&number=${number}&amount=${amount}&opid=${opid}&order_id=${order_id}&format=JSON`,
      key_prefix: kwikApiKey.substring(0, 6) + '****'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
