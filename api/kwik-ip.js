import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req, res) {
  let outboundIp = "Unknown";
  let fetchOptions = {
    timeout: 5000
  };
  let proxyUsed = false;

  // Support for Outbound Proxy (Static IP)
  const proxyUrl = process.env.OUTBOUND_PROXY_URL || process.env.FIXIE_URL;
  if (proxyUrl) {
    try {
      fetchOptions.agent = new HttpsProxyAgent(proxyUrl);
      proxyUsed = true;
    } catch (proxyError) {
      console.error('[kwik-ip] Proxy agent initialization failed:', proxyError);
    }
  }


  try {
    // Call an external service to see our outbound IP
    const response = await fetch('https://api.ipify.org?format=json', fetchOptions);
    const data = await response.json();
    outboundIp = data.ip;
  } catch (error) {
    outboundIp = `Error (Proxy might be invalid): ${error.message}`;
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  res.status(200).json({
    message: "This tool shows the IP that KwikAPI will see when you make a request.",
    outbound_ip: outboundIp,
    proxy_configured: !!(process.env.OUTBOUND_PROXY_URL || process.env.FIXIE_URL),
    proxy_active: proxyUsed,
    your_browser_ip: clientIp,
    vercel_region: process.env.VERCEL_REGION || "local",
    instruction: "If 'proxy_active' is true, whitelist 'outbound_ip' in KwikAPI. If false, you must ensure FIXIE_URL or OUTBOUND_PROXY_URL is set in Vercel."
  });

}

