const https = require('https');

const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3eWxocW5iamRzZXZ3YnNlY2p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQyMTM1MSwiZXhwIjoyMDgyOTk3MzUxfQ.7Kr6sNfI5vXKQkauuL-KtNGLbU5jAQkyzB_79NPHz_w';

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
    'apikey': 'sb_publishable_Zv7KPxJhC4mWki1s27rZvQ_6GVRT8WD',
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
