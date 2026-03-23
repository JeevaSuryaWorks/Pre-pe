export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { number } = req.body;
  if (!number) {
    return res.status(400).json({ success: false, error: 'Missing number' });
  }

  const kwikApiKey = process.env.KWIK_API_KEY;
  if (!kwikApiKey) {
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    const formData = new URLSearchParams();
    formData.append('api_key', kwikApiKey);
    formData.append('number', number);

    const apiRes = await fetch('https://www.kwikapi.com/api/v2/operator_fetch_v2.php', {
      method: 'POST',
      body: formData
    });
    
    let text = await apiRes.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch(e) {
        // Handle weird PHP responses that might be raw text instead of JSON
        return res.status(200).json({ success: false, error: 'Malformed response from provider', raw: text });
    }
    
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('Operator detect error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
