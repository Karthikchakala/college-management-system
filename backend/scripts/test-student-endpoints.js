const https = require('https');
const { CognitoIdentityProviderClient, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const userPoolId = 'us-east-1_Ic9huqJjL';
const clientId = '3kv2vgpkklqtlpfom2t72dn29n';
const password = 'TempPassword123!';
const apiBase = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';

async function getStudentToken() {
  const res = await cognito.send(new AdminInitiateAuthCommand({
    UserPoolId: userPoolId,
    ClientId: clientId,
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    AuthParameters: { USERNAME: 'student@campus.local', PASSWORD: password }
  }));
  return res.AuthenticationResult.IdToken;
}

function request(path, token, method = 'GET') {
  return new Promise((resolve) => {
    const url = new URL(apiBase + path);
    const headers = {};
    if (token) headers['Authorization'] = 'Bearer ' + token;
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
    req.end();
  });
}

async function testAllStudentEndpoints() {
  console.log('=== AUTHENTICATING STUDENT USER ===');
  const token = await getStudentToken();
  console.log('✓ Acquired verified Student Cognito ID token.\n');

  const endpoints = [
    { name: 'Student Profile', path: '/auth/profile' },
    { name: 'Student Dashboard', path: '/student/dashboard' },
    { name: 'Enrolled Courses', path: '/student/courses' },
    { name: 'Student Attendance', path: '/student/attendance' },
    { name: 'Student Assignments', path: '/student/assignments' },
    { name: 'Student Exams', path: '/student/exams' },
    { name: 'Student Results', path: '/student/results' },
    { name: 'Campus Events', path: '/events' },
    { name: 'Campus Announcements', path: '/announcements' },
    { name: 'Notifications', path: '/notifications' },
  ];

  for (const ep of endpoints) {
    const res = await request(ep.path, token);
    console.log(`✓ ${ep.name} (${ep.path}): Status ${res.status}`);
    if (res.json) {
      console.log('  Data:', JSON.stringify(res.json.data || res.json).slice(0, 200));
    } else {
      console.log('  Raw:', res.raw || res.error);
    }
  }
}

testAllStudentEndpoints();
