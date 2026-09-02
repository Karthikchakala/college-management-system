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
          resolve({ status: res.statusCode, raw: data.slice(0, 300) });
        }
      });
    });
    req.on('error', e => resolve({ error: e.message }));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testProfiles() {
  console.log('=== 1. TESTING STUDENT PROFILE ===');
  const stuToken = await getToken('student@campus.local');
  const stuGet = await request('/auth/profile', stuToken);
  console.log('Student GET status:', stuGet.status, 'Name:', stuGet.json?.data?.user?.student?.firstName, stuGet.json?.data?.user?.student?.lastName);

  const stuPut = await request('/auth/profile', stuToken, 'PUT', {
    phone: '+1 (555) 345-6789',
    address: '742 Evergreen Terrace, Academic Heights, CA',
    gender: 'Female'
  });
  console.log('Student PUT status:', stuPut.status, 'Message:', stuPut.json?.message);

  const stuGetAfter = await request('/auth/profile', stuToken);
  console.log('Student Verified Updated Address:', stuGetAfter.json?.data?.user?.student?.address);

  console.log('\n=== 2. TESTING FACULTY PROFILE ===');
  const facToken = await getToken('faculty@campus.local');
  const facGet = await request('/auth/profile', facToken);
  console.log('Faculty GET status:', facGet.status, 'Name:', facGet.json?.data?.user?.faculty?.firstName, facGet.json?.data?.user?.faculty?.lastName);

  const facPut = await request('/auth/profile', facToken, 'PUT', {
    qualification: 'Ph.D. in Computer Engineering (Stanford)',
    specialization: 'Digital Logic, VLSI, and Distributed Cloud Systems',
    experience: 12,
    address: '100 University Plaza, Faculty Housing Tower B, CA'
  });
  console.log('Faculty PUT status:', facPut.status, 'Message:', facPut.json?.message);

  const facGetAfter = await request('/auth/profile', facToken);
  console.log('Faculty Verified Updated Specialization:', facGetAfter.json?.data?.user?.faculty?.specialization);

  console.log('\n=== 3. TESTING ADMIN PROFILE ===');
  const admToken = await getToken('admin@campus.local');
  const admGet = await request('/auth/profile', admToken);
  console.log('Admin GET status:', admGet.status, 'Email:', admGet.json?.data?.user?.email);

  const admPut = await request('/auth/profile', admToken, 'PUT', {
    name: 'Campus System Administrator',
    phone: '+1 (555) 999-0000'
  });
  console.log('Admin PUT status:', admPut.status, 'Message:', admPut.json?.message);

  const admGetAfter = await request('/auth/profile', admToken);
  console.log('Admin Verified Updated Name:', admGetAfter.json?.data?.user?.name);
}

testProfiles();
