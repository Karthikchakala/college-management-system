const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const CLIENT_ID = '3kv2vgpkklqtlpfom2t72dn29n';
const API_BASE = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';

async function getCognitoToken(username, password) {
  const res = await cognito.send(new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  }));
  return res.AuthenticationResult.IdToken;
}

async function run() {
  const token = await getCognitoToken('faculty@campus.local', 'TempPassword123!');
  console.log('Obtained Cognito IdToken for faculty.');

  const res = await fetch(`${API_BASE}/faculty/courses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Faculty Courses Response:', JSON.stringify(data, null, 2));
}

run().catch(console.error);
