const http = require('http');
const https = require('https');

// 1. Check local frontend
http.get('http://localhost:3000', (res) => {
  console.log(`✓ Local Frontend (localhost:3000): HTTP ${res.statusCode}`);
}).on('error', (err) => {
  console.error(`✗ Frontend error:`, err.message);
});

// 2. Check AWS API Gateway / Health
https.get('https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`✓ AWS API Gateway /health: HTTP ${res.statusCode} -> ${data.trim()}`);
  });
}).on('error', (err) => {
  console.error(`✗ API Gateway error:`, err.message);
});
