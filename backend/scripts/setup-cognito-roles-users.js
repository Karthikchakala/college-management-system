const {
  CognitoIdentityProviderClient,
  CreateGroupCommand,
  GetGroupCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  DescribeUserPoolClientCommand,
  UpdateUserPoolClientCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const region = 'us-east-1';
const userPoolId = 'us-east-1_Ic9huqJjL';
const clientId = '3kv2vgpkklqtlpfom2t72dn29n';

const client = new CognitoIdentityProviderClient({ region });

// Common secure test password for test accounts
const defaultTestPassword = 'TempPassword123!';

const groupsToCreate = [
  { groupName: 'STUDENT', description: 'CloudCampus Student Group', precedence: 30 },
  { groupName: 'FACULTY', description: 'CloudCampus Faculty Group', precedence: 20 },
  { groupName: 'ADMIN', description: 'CloudCampus Administrator Group', precedence: 10 },
];

const usersToProvision = [
  // Students
  {
    email: 'karthikc11105@gmail.com',
    name: 'Karthik Chakala',
    role: 'STUDENT',
    group: 'STUDENT',
  },
  {
    email: 'manoj23iiitk27@gmail.com',
    name: 'Manoj Kumar',
    role: 'STUDENT',
    group: 'STUDENT',
  },
  {
    email: 'boggavarapupraveen2036@gmail.com',
    name: 'Praveen Boggavarapu',
    role: 'STUDENT',
    group: 'STUDENT',
  },
  {
    email: 'student@campus.local',
    name: 'Student Demo',
    role: 'STUDENT',
    group: 'STUDENT',
  },

  // Faculty
  {
    email: 'shaikvenkat17@gmail.com',
    name: 'Shaik Venkat',
    role: 'FACULTY',
    group: 'FACULTY',
  },
  {
    email: 'deepakgannamaneni@gmail.com',
    name: 'Deepak Gannamaneni',
    role: 'FACULTY',
    group: 'FACULTY',
  },
  {
    email: 'bhargavreddynarra2605@gmail.com',
    name: 'Bhargav Reddy Narra',
    role: 'FACULTY',
    group: 'FACULTY',
  },
  {
    email: 'ur4207546@gmail.com',
    name: 'UR Faculty',
    role: 'FACULTY',
    group: 'FACULTY',
  },
  {
    email: 'faculty@campus.local',
    name: 'Faculty Demo',
    role: 'FACULTY',
    group: 'FACULTY',
  },

  // Admin
  {
    email: 'admin@campus.edu',
    name: 'System Administrator',
    role: 'ADMIN',
    group: 'ADMIN',
  },
  {
    email: 'admin@campus.local',
    name: 'Admin Demo',
    role: 'ADMIN',
    group: 'ADMIN',
  },
];

async function setupCognito() {
  console.log('================================================================');
  console.log('COGNITO USER POOL & APP CLIENT PROVISIONING');
  console.log(`Region: ${region} | UserPoolId: ${userPoolId} | ClientId: ${clientId}`);
  console.log('================================================================\n');

  // Step 1: Update App Client Callback and Logout URLs
  console.log('[Step 1] Updating App Client Allowed Callback and Logout URLs...');
  try {
    const currentClientDesc = await client.send(
      new DescribeUserPoolClientCommand({ UserPoolId: userPoolId, ClientId: clientId })
    );
    const existingClient = currentClientDesc.UserPoolClient;

    const allowedCallbacks = [
      'http://localhost:3000',
      'http://localhost:3000/login',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com',
      'http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com/login',
      'http://cloudcampus-frontend-production.s3-website.us-east-1.amazonaws.com',
      'http://cloudcampus-frontend-production.s3-website.us-east-1.amazonaws.com/login',
    ];

    const allowedLogouts = [
      'http://localhost:3000',
      'http://localhost:3000/login',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com',
      'http://cloudcampus-frontend-production.s3-website-us-east-1.amazonaws.com/login',
      'http://cloudcampus-frontend-production.s3-website.us-east-1.amazonaws.com',
      'http://cloudcampus-frontend-production.s3-website.us-east-1.amazonaws.com/login',
    ];

    await client.send(
      new UpdateUserPoolClientCommand({
        UserPoolId: userPoolId,
        ClientId: clientId,
        ClientName: existingClient.ClientName,
        CallbackURLs: [...new Set([...(existingClient.CallbackURLs || []), ...allowedCallbacks])],
        LogoutURLs: [...new Set([...(existingClient.LogoutURLs || []), ...allowedLogouts])],
        AllowedOAuthFlows: existingClient.AllowedOAuthFlows || ['code', 'implicit'],
        AllowedOAuthScopes: existingClient.AllowedOAuthScopes || ['email', 'openid', 'phone'],
        AllowedOAuthFlowsUserPoolClient: true,
        SupportedIdentityProviders: existingClient.SupportedIdentityProviders || ['COGNITO'],
      })
    );
    console.log('  ✓ App Client Callback & Logout URLs successfully updated.');
  } catch (err) {
    console.error('  ✕ Error updating App Client URLs:', err.message);
  }

  // Step 2: Create Groups (STUDENT, FACULTY, ADMIN)
  console.log('\n[Step 2] Creating Cognito Groups (STUDENT, FACULTY, ADMIN)...');
  for (const g of groupsToCreate) {
    try {
      await client.send(
        new CreateGroupCommand({
          UserPoolId: userPoolId,
          GroupName: g.groupName,
          Description: g.description,
          Precedence: g.precedence,
        })
      );
      console.log(`  ✓ Group created: ${g.groupName}`);
    } catch (err) {
      if (err.name === 'GroupExistsException') {
        console.log(`  ✓ Group already exists: ${g.groupName}`);
      } else {
        console.error(`  ✕ Error creating group ${g.groupName}:`, err.message);
      }
    }
  }

  // Step 3: Provision and Confirm Test Accounts
  console.log('\n[Step 3] Provisioning and assigning groups for Student, Faculty, and Admin accounts...');
  for (const u of usersToProvision) {
    console.log(`\n  Processing user: ${u.email} [Role: ${u.role}]`);

    // 3a. Try creating user if does not exist
    let username = u.email;
    try {
      const createRes = await client.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: u.email,
          UserAttributes: [
            { Name: 'email', Value: u.email },
            { Name: 'email_verified', Value: 'true' },
            { Name: 'name', Value: u.name },
          ],
          MessageAction: 'SUPPRESS', // Don't send welcome email
        })
      );
      username = createRes.User.Username;
      console.log(`    ✓ User created: ${username}`);
    } catch (err) {
      if (err.name === 'UsernameExistsException') {
        console.log(`    ✓ User already exists in Cognito: ${u.email}`);
      } else {
        console.error(`    ✕ Error creating user ${u.email}:`, err.message);
      }
    }

    // 3b. Set permanent password
    try {
      await client.send(
        new AdminSetUserPasswordCommand({
          UserPoolId: userPoolId,
          Username: u.email,
          Password: defaultTestPassword,
          Permanent: true,
        })
      );
      console.log(`    ✓ Password set and account confirmed`);
    } catch (err) {
      console.error(`    ✕ Error setting password for ${u.email}:`, err.message);
    }

    // 3c. Ensure email_verified = true
    try {
      await client.send(
        new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: u.email,
          UserAttributes: [
            { Name: 'email_verified', Value: 'true' },
            { Name: 'name', Value: u.name },
          ],
        })
      );
      console.log(`    ✓ Verified email_verified attribute`);
    } catch (err) {
      console.error(`    ✕ Error updating attributes for ${u.email}:`, err.message);
    }

    // 3d. Add user to group
    try {
      await client.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: u.email,
          GroupName: u.group,
        })
      );
      console.log(`    ✓ Assigned to group: ${u.group}`);
    } catch (err) {
      console.error(`    ✕ Error assigning group ${u.group} for ${u.email}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log('COGNITO PROVISIONING COMPLETED SUCCESSFULLY!');
  console.log('================================================================\n');
}

setupCognito().catch(err => {
  console.error('Setup error:', err);
  process.exit(1);
});
