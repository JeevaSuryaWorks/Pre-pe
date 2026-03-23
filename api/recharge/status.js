export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { order_id } = req.query;
  if (!order_id) {
    return res.status(400).json({ success: false, error: 'Missing order_id' });
  }

  const kwikApiKey = process.env.KWIK_API_KEY;
  if (!kwikApiKey) {
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    const apiUrl = `https://www.kwikapi.com/api/v2/transactions.php?api_key=${kwikApiKey}&order_id=${order_id}`;
    const apiRes = await fetch(apiUrl);
    const data = await apiRes.json();
    
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Status check error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
