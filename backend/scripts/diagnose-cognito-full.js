const {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  DescribeUserPoolClientCommand,
  ListGroupsCommand,
  ListUsersCommand,
  ListUsersInGroupCommand,
  AdminListGroupsForUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const region = 'us-east-1';
const userPoolId = 'us-east-1_Ic9huqJjL';
const clientId = '3kv2vgpkklqtlpfom2t72dn29n';

const client = new CognitoIdentityProviderClient({ region });

async function diagnoseCognito() {
  console.log('================================================================');
  console.log('COGNITO LIVE DIAGNOSTIC AUDIT');
  console.log(`Region: ${region} | UserPoolId: ${userPoolId} | ClientId: ${clientId}`);
  console.log('================================================================\n');

  // 1. Describe User Pool
  try {
    const pool = await client.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
    const p = pool.UserPool;
    console.log('--- 1. USER POOL DETAILS ---');
    console.log(`Name: ${p.Name}`);
    console.log(`Status: ${p.Status}`);
    console.log(`Domain: ${p.Domain || p.CustomDomain || 'No root domain'}`);
    console.log(`EstimatedUsers: ${p.EstimatedNumberOfUsers}`);
    console.log(`Schema Attributes: ${p.SchemaAttributes?.map(a => a.Name).join(', ')}`);
  } catch (err) {
    console.error('Error describing user pool:', err.message);
  }

  // 2. Describe App Client
  try {
    const clientDesc = await client.send(
      new DescribeUserPoolClientCommand({ UserPoolId: userPoolId, ClientId: clientId })
    );
    const c = clientDesc.UserPoolClient;
    console.log('\n--- 2. APP CLIENT DETAILS ---');
    console.log(`ClientName: ${c.ClientName}`);
    console.log(`CallbackURLs: ${JSON.stringify(c.CallbackURLs)}`);
    console.log(`LogoutURLs: ${JSON.stringify(c.LogoutURLs)}`);
    console.log(`AllowedOAuthFlows: ${JSON.stringify(c.AllowedOAuthFlows)}`);
    console.log(`AllowedOAuthScopes: ${JSON.stringify(c.AllowedOAuthScopes)}`);
    console.log(`AllowedOAuthFlowsUserPoolClient: ${c.AllowedOAuthFlowsUserPoolClient}`);
    console.log(`SupportedIdentityProviders: ${JSON.stringify(c.SupportedIdentityProviders)}`);
  } catch (err) {
    console.error('Error describing user pool client:', err.message);
  }

  // 3. List Groups
  let groups = [];
  try {
    const groupsRes = await client.send(new ListGroupsCommand({ UserPoolId: userPoolId }));
    groups = groupsRes.Groups || [];
    console.log('\n--- 3. COGNITO USER POOL GROUPS ---');
    console.log(`Total Groups: ${groups.length}`);
    for (const g of groups) {
      console.log(`  - GroupName: ${g.GroupName}, Description: ${g.Description}, Precedence: ${g.Precedence}`);
    }
  } catch (err) {
    console.error('Error listing groups:', err.message);
  }

  // 4. List Users & their attributes & groups
  try {
    const usersRes = await client.send(new ListUsersCommand({ UserPoolId: userPoolId }));
    const users = usersRes.Users || [];
    console.log('\n--- 4. COGNITO USERS ---');
    console.log(`Total Users: ${users.length}`);

    for (const u of users) {
      const attrMap = {};
      u.Attributes.forEach(a => { attrMap[a.Name] = a.Value; });

      // Get user groups
      let userGroups = [];
      try {
        const ugRes = await client.send(
          new AdminListGroupsForUserCommand({ UserPoolId: userPoolId, Username: u.Username })
        );
        userGroups = ugRes.Groups?.map(g => g.GroupName) || [];
      } catch (gErr) {
        userGroups = [`Error: ${gErr.message}`];
      }

      console.log(`\n  User: ${u.Username} (Status: ${u.UserStatus}, Enabled: ${u.Enabled})`);
      console.log(`    sub: ${attrMap['sub']}`);
      console.log(`    email: ${attrMap['email']} (verified: ${attrMap['email_verified']})`);
      console.log(`    name: ${attrMap['name'] || '(none)'}`);
      console.log(`    custom:role: ${attrMap['custom:role'] || '(none)'}`);
      console.log(`    Groups: ${JSON.stringify(userGroups)}`);
      console.log(`    Created: ${u.UserCreateDate}, Modified: ${u.UserLastModifiedDate}`);
    }
  } catch (err) {
    console.error('Error listing users:', err.message);
  }

  console.log('\n================================================================');
  console.log('DIAGNOSTIC AUDIT COMPLETE');
  console.log('================================================================');
}

diagnoseCognito().catch(err => {
  console.error('Diagnostic error:', err);
});
