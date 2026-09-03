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
  console.log('Authenticating Faculty deepakgannamaneni@gmail.com...');
  const facultyToken = await getCognitoToken('deepakgannamaneni@gmail.com', 'Password@123');
  console.log('Faculty Auth OK!');

  const facultyProfile = await apiRequest('GET', '/auth/profile', facultyToken);
  console.log('Faculty Profile Data:', JSON.stringify(facultyProfile.data, null, 2));

  const facultyCourses = await apiRequest('GET', '/faculty/courses', facultyToken);
  console.log('Faculty Courses:', JSON.stringify(facultyCourses.data, null, 2));

  console.log('\nAuthenticating Student karthikc11105@gmail.com...');
  const studentToken = await getCognitoToken('karthikc11105@gmail.com', 'Password@123');
  console.log('Student Auth OK!');

  const studentProfile = await apiRequest('GET', '/auth/profile', studentToken);
  console.log('Student Profile Data:', JSON.stringify(studentProfile.data, null, 2));

  const studentCourses = await apiRequest('GET', '/student/courses', studentToken);
  console.log('Student Courses:', JSON.stringify(studentCourses.data, null, 2));
}

run().catch(console.error);
