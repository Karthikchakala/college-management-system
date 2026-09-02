const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminInitiateAuthCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const region = 'us-east-1';
const userPoolId = 'us-east-1_Ic9huqJjL';
const clientId = '3kv2vgpkklqtlpfom2t72dn29n';

const client = new CognitoIdentityProviderClient({ region });
const password = 'TempPassword123!';

function decodeJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
  } catch (e) {
    return null;
  }
}

async function testUser(email, expectedRole) {
  console.log(`\n================================================================`);
  console.log(`TESTING COGNITO AUTHENTICATION FOR: ${email} (Expected: ${expectedRole})`);
  console.log(`================================================================`);

  try {
    const authRes = await client.send(
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

    const authResult = authRes.AuthenticationResult;
    if (!authResult) {
      console.log('Challenge received:', authRes.ChallengeName);
      return { success: false, reason: `Challenge: ${authRes.ChallengeName}` };
    }

    const idPayload = decodeJwt(authResult.IdToken);
    const accessPayload = decodeJwt(authResult.AccessToken);

    console.log('✓ Authentication Succeeded!');
    console.log('  ID Token Claims:');
    console.log(`    sub: ${idPayload.sub}`);
    console.log(`    email: ${idPayload.email} (verified: ${idPayload.email_verified})`);
    console.log(`    name: ${idPayload.name}`);
    console.log(`    cognito:groups: ${JSON.stringify(idPayload['cognito:groups'])}`);
    console.log(`    token_use: ${idPayload.token_use}`);
    console.log(`    iss: ${idPayload.iss}`);

    // Resolve role according to AuthContext logic
    let resolvedRole = 'STUDENT';
    const groups = [
      ...(Array.isArray(idPayload['cognito:groups']) ? idPayload['cognito:groups'] : []),
      ...(Array.isArray(accessPayload['cognito:groups']) ? accessPayload['cognito:groups'] : []),
    ];

    if (idPayload['custom:role']) {
      resolvedRole = idPayload['custom:role'].toUpperCase();
    } else if (groups.includes('ADMIN')) {
      resolvedRole = 'ADMIN';
    } else if (groups.includes('FACULTY')) {
      resolvedRole = 'FACULTY';
    } else if (groups.includes('STUDENT')) {
      resolvedRole = 'STUDENT';
    }

    console.log(`\n  Resolved Role: ${resolvedRole} | Expected: ${expectedRole}`);
    const matches = resolvedRole === expectedRole;
    console.log(`  Role Resolution Match: ${matches ? 'PASS' : 'FAIL'}`);

    return {
      success: true,
      email,
      resolvedRole,
      expectedRole,
      matches,
      sub: idPayload.sub,
      idToken: authResult.IdToken,
      accessToken: authResult.AccessToken,
    };
  } catch (err) {
    console.error(`✕ Authentication Failed for ${email}:`, err.message);
    return { success: false, email, error: err.message };
  }
}

async function runAllTests() {
  const testAccounts = [
    { email: 'karthikc11105@gmail.com', role: 'STUDENT' },
    { email: 'manoj23iiitk27@gmail.com', role: 'STUDENT' },
    { email: 'shaikvenkat17@gmail.com', role: 'FACULTY' },
    { email: 'deepakgannamaneni@gmail.com', role: 'FACULTY' },
    { email: 'admin@campus.edu', role: 'ADMIN' },
    { email: 'admin@campus.local', role: 'ADMIN' },
  ];

  const results = [];
  for (const acct of testAccounts) {
    const res = await testUser(acct.email, acct.role);
    results.push(res);
  }

  console.log('\n================================================================');
  console.log('SUMMARY OF COGNITO AUTHENTICATION & ROLE MAPPING TESTS');
  console.log('================================================================');
  console.table(
    results.map(r => ({
      Email: r.email,
      Expected: r.expectedRole,
      Resolved: r.resolvedRole,
      RoleMatch: r.matches ? 'PASS' : 'FAIL',
      Status: r.success ? 'PASS' : 'FAIL',
    }))
  );
}

runAllTests().catch(err => {
  console.error('Test runner error:', err);
});
