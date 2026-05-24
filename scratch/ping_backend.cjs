const http = require('http');

http.get('http://127.0.0.1:3000/api/health', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
}).on('error', (err) => {
  console.error('ERROR:', err);
});
