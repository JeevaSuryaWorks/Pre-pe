import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { endpoint, params, method = 'GET' } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({ error: 'Missing endpoint' });
  }

  const kwikApiKey = process.env.KWIK_API_KEY || process.env.VITE_KWIK_API_KEY;
  if (!kwikApiKey) {
    return res.status(500).json({ error: 'KWIK_API_KEY not configured in environment' });
  }

  try {
    const baseUrl = 'https://www.kwikapi.com/api/v2';
    let url = `${baseUrl}${endpoint}`;
    let options = { 
      method,
      timeout: 10000 // 10s timeout
    };
    
    // Configure Proxy if available
    const proxyUrl = process.env.OUTBOUND_PROXY_URL || process.env.FIXIE_URL;
    if (proxyUrl) {
      try {
        options.agent = new HttpsProxyAgent(proxyUrl);
        console.log('[kwik-proxy] Using Proxy:', proxyUrl.split('@').pop());
      } catch (proxyError) {
        console.error('[kwik-proxy] Proxy agent initialization failed:', proxyError);
      }
    }


    if (method === 'GET') {
      const sp = new URLSearchParams();
      sp.append('api_key', kwikApiKey);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null) sp.append(k, String(v));
        }
      }
      url = `${url}?${sp.toString()}`;
    } else if (method === 'POST') {
      const formData = new URLSearchParams();
      formData.append('api_key', kwikApiKey);
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null) formData.append(k, String(v));
        }
      }
      options.body = formData;
      options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    }

    const apiRes = await fetch(url, options);
    const text = await apiRes.text();
    
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return res.status(200).json({ 
        error: 'Parse Error', 
        raw: text,
        proxy_active: !!options.agent
      });
    }

    return res.status(200).json({
      ...data,
      proxy_active: !!options.agent
    });
  } catch (error) {
    console.error('KWIK Proxy Error:', error);
    return res.status(500).json({ 
      error: error.message,
      proxy_active: !!process.env.OUTBOUND_PROXY_URL
    });
  }
}

