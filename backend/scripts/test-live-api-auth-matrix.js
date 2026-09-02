const {
  CognitoIdentityProviderClient,
  AdminInitiateAuthCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const apiGatewayUrl = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';
const region = 'us-east-1';
const userPoolId = 'us-east-1_Ic9huqJjL';
const clientId = '3kv2vgpkklqtlpfom2t72dn29n';
const password = 'TempPassword123!';

const cognito = new CognitoIdentityProviderClient({ region });

async function getToken(email) {
  const res = await cognito.send(
    new AdminInitiateAuthCommand({
      UserPoolId: userPoolId,
      ClientId: clientId,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    })
  );
  return res.AuthenticationResult.IdToken;
}

async function runMatrixTests() {
  console.log('================================================================');
  console.log('LIVE API GATEWAY ROLE AUTHORIZATION MATRIX TEST');
  console.log(`Endpoint: ${apiGatewayUrl}`);
  console.log('================================================================\n');

  console.log('[1/3] Authenticating test accounts with AWS Cognito...');
  const studentToken = await getToken('karthikc11105@gmail.com');
  const facultyToken = await getToken('shaikvenkat17@gmail.com');
  const adminToken = await getToken('admin@campus.edu');
  console.log('  ✓ Acquired verified Cognito ID tokens for Student, Faculty, and Admin.\n');

  const tests = [
    // Profile tests
    { name: 'Student Profile', role: 'STUDENT', token: studentToken, method: 'get', path: '/auth/profile', expectedStatus: 200 },
    { name: 'Faculty Profile', role: 'FACULTY', token: facultyToken, method: 'get', path: '/auth/profile', expectedStatus: 200 },
    { name: 'Admin Profile', role: 'ADMIN', token: adminToken, method: 'get', path: '/auth/profile', expectedStatus: 200 },

    // Student Endpoint access
    { name: 'Student -> Student Dashboard', role: 'STUDENT', token: studentToken, method: 'get', path: '/student/dashboard', expectedStatus: 200 },
    { name: 'Student -> Faculty Dashboard (Forbidden)', role: 'STUDENT', token: studentToken, method: 'get', path: '/faculty/dashboard', expectedStatus: 403 },
    { name: 'Student -> Admin Users (Forbidden)', role: 'STUDENT', token: studentToken, method: 'get', path: '/admin/users', expectedStatus: 403 },

    // Faculty Endpoint access
    { name: 'Faculty -> Faculty Dashboard', role: 'FACULTY', token: facultyToken, method: 'get', path: '/faculty/dashboard', expectedStatus: 200 },
    { name: 'Faculty -> Admin Users (Forbidden)', role: 'FACULTY', token: facultyToken, method: 'get', path: '/admin/users', expectedStatus: 403 },

    // Admin Endpoint access
    { name: 'Admin -> Admin Users', role: 'ADMIN', token: adminToken, method: 'get', path: '/admin/users', expectedStatus: 200 },
    { name: 'Admin -> Admin Monitoring Telemetry', role: 'ADMIN', token: adminToken, method: 'get', path: '/admin/monitoring/telemetry', expectedStatus: 200 },
  ];

  const results = [];

  for (const t of tests) {
    try {
      const res = await fetch(`${apiGatewayUrl}${t.path}`, {
        method: t.method,
        headers: {
          Authorization: `Bearer ${t.token}`,
        },
      });

      const pass = res.status === t.expectedStatus;
      console.log(`Test [${t.name}]: Status ${res.status} (Expected: ${t.expectedStatus}) -> ${pass ? 'PASS' : 'FAIL'}`);

      results.push({
        Test: t.name,
        Role: t.role,
        Path: t.path,
        Status: res.status,
        Expected: t.expectedStatus,
        Result: pass ? 'PASS' : 'FAIL',
      });
    } catch (err) {
      console.error(`Error executing test ${t.name}:`, err.message);
      results.push({
        Test: t.name,
        Role: t.role,
        Path: t.path,
        Status: 'ERR',
        Expected: t.expectedStatus,
        Result: 'FAIL',
      });
    }
  }

  console.log('\n================================================================');
  console.log('API AUTHORIZATION MATRIX TEST RESULTS');
  console.log('================================================================');
  console.table(results);
}

runMatrixTests().catch(err => {
  console.error('Test matrix error:', err);
});
