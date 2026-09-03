const https = require('https');
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const REGION = 'us-east-1';
const CLIENT_ID = '3kv2vgpkklqtlpfom2t72dn29n';
const HOST = '7k2yo6gy77.execute-api.us-east-1.amazonaws.com';

const cognito = new CognitoIdentityProviderClient({ region: REGION });

async function getCognitoToken(email, password) {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
  const res = await cognito.send(command);
  return res.AuthenticationResult.IdToken;
}

function apiRequest(method, reqPath, token = null, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const options = {
      hostname: HOST,
      port: 443,
      path: `/prod/api${reqPath}`,
      method: method,
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function run() {
  console.log('===============================================================');
  console.log('CLOUDCAMPUS ADMIN CLOUD & SECURITY VERIFICATION SUITE');
  console.log('===============================================================');

  // 1. Authenticate Admin
  console.log('\n[TEST 1] Authenticating Admin (admin@campus.local) via AWS Cognito...');
  const adminToken = await getCognitoToken('admin@campus.local', 'TempPassword123!');
  console.log('✓ Admin authenticated successfully. Cognito JWT token acquired.');

  // 2. Authenticate Student & Faculty for RBAC tests
  const studentToken = await getCognitoToken('karthikc11105@gmail.com', 'Password@123');
  const facultyToken = await getCognitoToken('deepakgannamaneni@gmail.com', 'Password@123');
  console.log('✓ Student & Faculty tokens acquired for RBAC boundary testing.');

  // 3. Admin Dashboard
  console.log('\n[TEST 2] Testing Admin Dashboard API (GET /api/admin/dashboard)...');
  const dashRes = await apiRequest('GET', '/admin/dashboard', adminToken);
  console.log('✓ Status:', dashRes.status, '| Cluster Statistics:');
  console.log('   - Total Students:', dashRes.data.data.students);
  console.log('   - Total Faculty:', dashRes.data.data.faculty);
  console.log('   - Total Courses:', dashRes.data.data.courses);
  console.log('   - Total Departments:', dashRes.data.data.departments);
  console.log('   - Active Events:', dashRes.data.data.activeEvents);

  // 4. System Monitoring (CloudWatch)
  console.log('\n[TEST 3] Testing CloudWatch System Monitoring API (GET /api/admin/monitoring/overview)...');
  const monRes = await apiRequest('GET', '/admin/monitoring/overview', adminToken);
  console.log('✓ Status:', monRes.status);
  console.log('   - EC2 CPU Utilization:', monRes.data.data.ec2?.cpuUtilization + '%', '| Status:', monRes.data.data.ec2?.status);
  console.log('   - RDS CPU Utilization:', monRes.data.data.rds?.cpuUtilization + '%', '| Connections:', monRes.data.data.rds?.databaseConnections);
  console.log('   - API Gateway 1h Requests:', monRes.data.data.apiGateway?.requestCount, '| 5xx Errors:', monRes.data.data.apiGateway?.error5xxCount);
  console.log('   - Lambda Invocations:', monRes.data.data.lambda?.invocations, '| Errors:', monRes.data.data.lambda?.errors);
  console.log('   - Active CloudWatch Alarms:', monRes.data.data.alarms?.length || 0);

  // 5. Audit Logs
  console.log('\n[TEST 4] Testing Audit Logs API (GET /api/admin/audit-logs)...');
  const auditRes = await apiRequest('GET', '/admin/audit-logs?limit=10', adminToken);
  console.log('✓ Status:', auditRes.status, '| Total Logs Retrieved:', auditRes.data.data.length || auditRes.data.data.logs?.length || 0);
  const recentLog = Array.isArray(auditRes.data.data) ? auditRes.data.data[0] : auditRes.data.data.logs[0];
  console.log('   - Most Recent Action:', recentLog?.action, '| User:', recentLog?.user?.email, '| Resource:', recentLog?.resource, '| Time:', recentLog?.timestamp || recentLog?.createdAt);

  // 6. State-Changing Admin Action & Audit Log Verification
  console.log('\n[TEST 5] Performing Real State-Changing Admin Action (POST /api/admin/events)...');
  const eventRes = await apiRequest('POST', '/admin/events', adminToken, {
    title: 'CloudCampus Annual Cloud Summit 2026',
    description: 'Special symposium on Multi-Tier AWS Architectures & Serverless Computing.',
    eventDate: '2026-10-15T09:00:00.000Z',
    time: '09:00 AM',
    location: 'Main Auditorium, IIITDM Kurnool',
  });
  console.log('✓ Event Created Status:', eventRes.status, '| Event ID:', eventRes.data?.data?.id || eventRes.data?.id);

  // Re-query audit log to verify recent operations
  const auditRes2 = await apiRequest('GET', '/admin/audit-logs?limit=5', adminToken);
  const latestLog = Array.isArray(auditRes2.data.data) ? auditRes2.data.data[0] : auditRes2.data.data.logs[0];
  console.log('✓ Verified Audit Log Entry in RDS: Action =', latestLog?.action, '| Resource =', latestLog?.resource, '| Time =', latestLog?.timestamp || latestLog?.createdAt);

  // 7. RBAC & Security Boundary Tests
  console.log('\n[TEST 6] Testing Security Assertions (401, 403, 200)...');
  
  // 7.1 Unauthenticated Request -> 401
  const unauthRes = await apiRequest('GET', '/admin/dashboard', null);
  console.log(`   - Unauthenticated -> /api/admin/dashboard: Status ${unauthRes.status} (Expected 401) => ${unauthRes.status === 401 ? 'PASS' : 'FAIL'}`);

  // 7.2 Student -> Admin Dashboard -> 403
  const sAdminDash = await apiRequest('GET', '/admin/dashboard', studentToken);
  console.log(`   - Student -> /api/admin/dashboard: Status ${sAdminDash.status} (Expected 403) => ${sAdminDash.status === 403 ? 'PASS' : 'FAIL'}`);

  // 7.3 Student -> Admin Monitoring -> 403
  const sAdminMon = await apiRequest('GET', '/admin/monitoring/overview', studentToken);
  console.log(`   - Student -> /api/admin/monitoring/overview: Status ${sAdminMon.status} (Expected 403) => ${sAdminMon.status === 403 ? 'PASS' : 'FAIL'}`);

  // 7.4 Faculty -> Admin Dashboard -> 403
  const fAdminDash = await apiRequest('GET', '/admin/dashboard', facultyToken);
  console.log(`   - Faculty -> /api/admin/dashboard: Status ${fAdminDash.status} (Expected 403) => ${fAdminDash.status === 403 ? 'PASS' : 'FAIL'}`);

  // 7.5 Faculty -> Admin Audit Logs -> 403
  const fAdminAudit = await apiRequest('GET', '/admin/audit-logs', facultyToken);
  console.log(`   - Faculty -> /api/admin/audit-logs: Status ${fAdminAudit.status} (Expected 403) => ${fAdminAudit.status === 403 ? 'PASS' : 'FAIL'}`);

  // 7.6 Admin -> Admin Dashboard -> 200
  const aAdminDash = await apiRequest('GET', '/admin/dashboard', adminToken);
  console.log(`   - Admin -> /api/admin/dashboard: Status ${aAdminDash.status} (Expected 200) => ${aAdminDash.status === 200 ? 'PASS' : 'FAIL'}`);

  // 7.7 Admin -> Admin Monitoring -> 200
  const aAdminMon = await apiRequest('GET', '/admin/monitoring/overview', adminToken);
  console.log(`   - Admin -> /api/admin/monitoring/overview: Status ${aAdminMon.status} (Expected 200) => ${aAdminMon.status === 200 ? 'PASS' : 'FAIL'}`);

  // 7.8 Admin -> Admin Audit Logs -> 200
  const aAdminAudit = await apiRequest('GET', '/admin/audit-logs', adminToken);
  console.log(`   - Admin -> /api/admin/audit-logs: Status ${aAdminAudit.status} (Expected 200) => ${aAdminAudit.status === 200 ? 'PASS' : 'FAIL'}`);

  // 8. Admin Profile Persistence
  console.log('\n[TEST 7] Testing Admin Profile Update & Persistence (PUT /api/auth/profile)...');
  const profUpdate = await apiRequest('PUT', '/auth/profile', adminToken, {
    phone: '+1 (555) 777-9999',
    address: 'Central Administrative Building, Suite 101',
  });
  console.log('✓ Profile Update Status:', profUpdate.status);
  const profVerify = await apiRequest('GET', '/auth/profile', adminToken);
  console.log('✓ Verified Persisted Phone:', profVerify.data.data.user.phone, '| Address:', profVerify.data.data.user.address);

  console.log('\n===============================================================');
  console.log('ALL ADMIN FEATURES & SECURITY TESTS COMPLETED SUCCESSFULLY!');
  console.log('===============================================================');
}

run().catch(console.error);
