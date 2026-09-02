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

// Minimal 1x1 transparent PNG buffer
const samplePngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

function uploadAvatar(token, filename = 'avatar.png') {
  return new Promise((resolve) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const postDataHeader = `--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`;
    const postDataFooter = `\r\n--${boundary}--\r\n`;

    const body = Buffer.concat([
      Buffer.from(postDataHeader, 'utf8'),
      samplePngBuffer,
      Buffer.from(postDataFooter, 'utf8'),
    ]);

    const url = new URL(apiBase + '/auth/profile/avatar');
    const headers = {
      'Authorization': 'Bearer ' + token,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
    };

    const req = https.request(url, { method: 'POST', headers, timeout: 15000 }, (res) => {
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
    req.write(body);
    req.end();
  });
}

async function testAvatarUploads() {
  console.log('=== TESTING S3 AVATAR UPLOAD ===');

  console.log('\n1. Student Avatar Upload:');
  const stuToken = await getToken('student@campus.local');
  const stuUpload = await uploadAvatar(stuToken, 'emma_davis_profile.png');
  console.log('  Status:', stuUpload.status, 'S3 Key:', stuUpload.json?.data?.avatarKey);
  console.log('  Presigned URL starts with:', stuUpload.json?.data?.avatarUrl?.slice(0, 70));

  console.log('\n2. Faculty Avatar Upload:');
  const facToken = await getToken('faculty@campus.local');
  const facUpload = await uploadAvatar(facToken, 'alice_smith_profile.png');
  console.log('  Status:', facUpload.status, 'S3 Key:', facUpload.json?.data?.avatarKey);
  console.log('  Presigned URL starts with:', facUpload.json?.data?.avatarUrl?.slice(0, 70));

  console.log('\n3. Admin Avatar Upload:');
  const admToken = await getToken('admin@campus.local');
  const admUpload = await uploadAvatar(admToken, 'admin_profile.png');
  console.log('  Status:', admUpload.status, 'S3 Key:', admUpload.json?.data?.avatarKey);
  console.log('  Presigned URL starts with:', admUpload.json?.data?.avatarUrl?.slice(0, 70));
}

testAvatarUploads();
