const https = require('https');

const COGNITO_CLIENT_ID = '3kv2vgpkklqtlpfom2t72dn29n';
const API_BASE = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';

function loginCognito(email, password) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password }
    });

    const req = https.request({
      hostname: 'cognito-idp.us-east-1.amazonaws.com',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-amz-json-1.1',
        'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.write(payload);
    req.end();
  });
}

function apiGet(path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.end();
  });
}

async function main() {
  const sAuth = await loginCognito('karthikc11105@gmail.com', 'Password@123');
  const profile = await apiGet('/auth/profile', sAuth.AuthenticationResult.IdToken);
  console.log('Student Profile Response:', JSON.stringify(profile, null, 2));

  const fAuth = await loginCognito('deepakgannamaneni@gmail.com', 'Password@123');
  const fCourses = await apiGet('/faculty/courses', fAuth.AuthenticationResult.IdToken);
  console.log('Faculty Courses Response:', JSON.stringify(fCourses, null, 2));
}

main();
