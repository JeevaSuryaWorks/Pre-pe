const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Zv7KPxJhC4mWki1s27rZvQ_6GVRT8WD';

const data = JSON.stringify({
  user_id: '5cab5bf7-6756-4ca7-a056-6e503f050b7a',
  points: 50,
  event_type: 'SPIN_WHEEL',
  description: 'Won 50 points from Mega Fortune Wheel'
});

const options = {
  hostname: 'jwylhqnbjdsevwbsecjv.supabase.co',
  port: 443,
  path: '/rest/v1/reward_points_ledger',
  method: 'POST',
  headers: {
    'apikey': apiKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
};


const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:', body);
  });
});

req.on('error', (e) => {
  console.error('Request Error:', e);
});

req.write(data);
req.end();
