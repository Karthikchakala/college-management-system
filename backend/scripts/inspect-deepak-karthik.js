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

function apiRequest(method, path, token, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const options = {
      hostname: HOST,
      port: 443,
      path: `/prod/api${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(dataString);
    }

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
    if (body) req.write(dataString);
    req.end();
  });
}

async function run() {
  const facultyToken = await getCognitoToken('deepakgannamaneni@gmail.com', 'Password@123');
  const res = await apiRequest('GET', '/faculty/courses', facultyToken);
  console.log('Deepak Faculty Courses:');
  res.data.data.forEach(c => {
    console.log(`- Course: ${c.code} (${c.name}) [ID: ${c.id}] - Enrolled count: ${c.enrollments ? c.enrollments.length : (c._count ? c._count.enrollments : 'N/A')}`);
    if (c.enrollments) {
      c.enrollments.forEach(e => {
        console.log(`    Student: ${e.student?.firstName} ${e.student?.lastName} (${e.student?.user?.email})`);
      });
    }
  });

  const studentToken = await getCognitoToken('karthikc11105@gmail.com', 'Password@123');
  const sRes = await apiRequest('GET', '/student/courses', studentToken);
  console.log('\nKarthik Student Enrolled Courses:');
  sRes.data.data.forEach(c => {
    console.log(`- Course: ${c.code} (${c.name}) [ID: ${c.id}] - Faculty: ${c.faculty?.firstName} ${c.faculty?.lastName} (${c.faculty?.user?.email || c.faculty?.email})`);
  });
}

run().catch(console.error);
