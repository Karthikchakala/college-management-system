const https = require('https');
const { CognitoIdentityProviderClient, AdminInitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const userPoolId = 'us-east-1_Ic9huqJjL';
const clientId = '3kv2vgpkklqtlpfom2t72dn29n';
const password = 'TempPassword123!';
const apiBase = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';

async function getFacultyToken() {
  const res = await cognito.send(new AdminInitiateAuthCommand({
    UserPoolId: userPoolId,
    ClientId: clientId,
    AuthFlow: 'ADMIN_NO_SRP_AUTH',
    AuthParameters: { USERNAME: 'faculty@campus.local', PASSWORD: password }
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

async function testAllFacultyEndpoints() {
  console.log('=== AUTHENTICATING FACULTY USER ===');
  const token = await getFacultyToken();
  console.log('✓ Acquired verified Faculty Cognito ID token.\n');

  console.log('1. Faculty Profile (GET /auth/profile):');
  const prof = await request('/auth/profile', token);
  console.log('  Status:', prof.status, 'Faculty:', JSON.stringify(prof.json?.data?.user?.faculty || prof.json?.data).slice(0, 150));

  console.log('\n2. Faculty Dashboard (GET /faculty/dashboard):');
  const dash = await request('/faculty/dashboard', token);
  console.log('  Status:', dash.status, 'Data:', JSON.stringify(dash.json?.data).slice(0, 200));

  console.log('\n3. Assigned Courses (GET /faculty/courses):');
  const courses = await request('/faculty/courses', token);
  console.log('  Status:', courses.status, 'Courses:', JSON.stringify(courses.json?.data).slice(0, 200));

  const courseId = courses.json?.data?.[0]?.id;
  if (courseId) {
    console.log(`\n4. Course Enrolled Students (GET /faculty/courses/${courseId}/students):`);
    const students = await request(`/faculty/courses/${courseId}/students`, token);
    console.log('  Status:', students.status, 'Students Count:', students.json?.data?.length);

    console.log(`\n5. Course Attendance History (GET /faculty/attendance/${courseId}):`);
    const att = await request(`/faculty/attendance/${courseId}`, token);
    console.log('  Status:', att.status, 'Records Count:', att.json?.data?.length);
  }
}

testAllFacultyEndpoints();
