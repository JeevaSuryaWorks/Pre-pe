// KwikAPI IP Discovery Tool
// Visit /api/kwik-ip to see which IP you need to whitelist

export default async function handler(req, res) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.socket.remoteAddress;

  res.status(200).json({
    message: "Copy the IP below and add it to your KwikAPI 'Whitelisted IP Address' list.",
    your_ip: ip,
    vercel_region: process.env.VERCEL_REGION || "local",
    how_to_fix: "Go to KwikAPI Dashboard > Settings > Whitelisted IP Address > Add this IP."
  });
}
