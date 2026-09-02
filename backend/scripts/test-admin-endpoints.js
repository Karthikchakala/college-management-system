const https = require('https');
const { CognitoIdentityProviderClient, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const userPoolId = 'us-east-1_Ic9huqJjL';
const clientId = '3kv2vgpkklqtlpfom2t72dn29n';
const password = 'TempPassword123!';
const apiBase = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';

async function getAdminToken() {
  const res = await cognito.send(new AdminInitiateAuthCommand({
    UserPoolId: userPoolId,
    ClientId: clientId,
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    AuthParameters: { USERNAME: 'admin@campus.local', PASSWORD: password }
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

async function testAllAdminEndpoints() {
  console.log('=== AUTHENTICATING ADMIN USER ===');
  const token = await getAdminToken();
  console.log('✓ Acquired verified Admin Cognito ID token.\n');

  const endpoints = [
    { name: 'Admin Profile', path: '/auth/profile' },
    { name: 'Dashboard Stats', path: '/admin/dashboard-stats' },
    { name: 'Students List', path: '/admin/students' },
    { name: 'Faculty List', path: '/admin/faculty' },
    { name: 'Departments List', path: '/admin/departments' },
    { name: 'Courses List', path: '/admin/courses' },
    { name: 'Audit Logs', path: '/admin/audit-logs' },
    { name: 'Reports Summary', path: '/admin/reports/summary' },
    { name: 'Reports Attendance', path: '/admin/reports/attendance' },
    { name: 'Reports Performance', path: '/admin/reports/performance' },
    { name: 'Reports Faculty', path: '/admin/reports/faculty' },
    { name: 'Monitoring Overview', path: '/admin/monitoring/overview' },
    { name: 'Monitoring EC2', path: '/admin/monitoring/ec2' },
    { name: 'Monitoring API Gateway', path: '/admin/monitoring/api-gateway' },
    { name: 'Monitoring RDS', path: '/admin/monitoring/rds' },
    { name: 'Monitoring Logs', path: '/admin/monitoring/logs?limit=5' },
    { name: 'Monitoring Alarms', path: '/admin/monitoring/alarms' },
  ];

  const results = [];
  for (const ep of endpoints) {
    const res = await request(ep.path, token);
    const dataCount = res.json?.data ? (Array.isArray(res.json.data) ? res.json.data.length : (res.json.data.students || res.json.data.overview || 'object')) : 'N/A';
    results.push({
      Feature: ep.name,
      Path: ep.path,
      Status: res.status,
      Success: res.json?.success ?? false,
      CountOrSummary: dataCount,
    });
    console.log(`✓ ${ep.name} (${ep.path}): Status ${res.status}`, res.json?.success ? 'SUCCESS' : res.json || res.raw || res.error);
  }

  console.table(results);
}

testAllAdminEndpoints();
