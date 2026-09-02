const https = require('https');
const { CognitoIdentityProviderClient, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const userPoolId = 'us-east-1_Ic9huqJjL';
const clientId = '3kv2vgpkklqtlpfom2t72dn29n';
const password = 'TempPassword123!';
const apiBase = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';

async function getToken(username) {
  const res = await cognito.send(new AdminInitiateAuthCommand({
    UserPoolId: userPoolId,
    ClientId: clientId,
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    AuthParameters: { USERNAME: username, PASSWORD: password }
  }));
  return res.AuthenticationResult.IdToken;
}

function request(path, token, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(apiBase + path);
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    if (body) headers['Content-Type'] = 'application/json';
    const req = https.request(url, { method, headers, timeout: 8000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, json: JSON.parse(data) });
        } catch (_) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testCrossUserSecurity() {
  console.log('=== CROSS-USER SECURITY VERIFICATION ===');
  
  // Student Emma Davis tries to update Faculty Alice Smith's record by spoofing userId / facultyId in payload
  const stuToken = await getToken('student@campus.local');
  const spoofPayload = {
    userId: '76dceb49-d497-45df-84c1-9fbfdcdc11f2', // Alice Smith User ID
    facultyId: '1f681dc7-321f-40e0-886d-a5fe289ca4ed',
    firstName: 'HACKED_BY_STUDENT',
    specialization: 'MALICIOUS_OVERWRITE'
  };

  const spoofRes = await request('/auth/profile', stuToken, 'PUT', spoofPayload);
  console.log('Update Attempt Status:', spoofRes.status);

  // Now verify Faculty profile was NOT modified
  const facToken = await getToken('faculty@campus.local');
  const facProfile = await request('/auth/profile', facToken);
  console.log('Faculty Name in RDS:', facProfile.json?.data?.user?.faculty?.firstName, facProfile.json?.data?.user?.faculty?.lastName);
  console.log('Faculty Specialization in RDS:', facProfile.json?.data?.user?.faculty?.specialization);

  if (facProfile.json?.data?.user?.faculty?.firstName !== 'HACKED_BY_STUDENT') {
    console.log('✅ SECURITY PASS: Cross-user modification attempt was safely blocked by verified JWT identity isolation.');
  } else {
    console.error('❌ SECURITY FAILURE');
  }
}

testCrossUserSecurity();
