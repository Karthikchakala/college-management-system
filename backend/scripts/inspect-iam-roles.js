const { IAMClient, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand, GetRolePolicyCommand } = require('@aws-sdk/client-iam');

const iam = new IAMClient({ region: 'us-east-1' });

async function inspectRolePolicies(roleName) {
  console.log(`=== POLICIES FOR ${roleName} ===`);
  const attRes = await iam.send(new ListAttachedRolePoliciesCommand({ RoleName: roleName }));
  attRes.AttachedPolicies?.forEach(p => console.log(` - Attached: ${p.PolicyName} (${p.PolicyArn})`));

  const inlineRes = await iam.send(new ListRolePoliciesCommand({ RoleName: roleName }));
  for (const pol of inlineRes.PolicyNames || []) {
    const polDetail = await iam.send(new GetRolePolicyCommand({ RoleName: roleName, PolicyName: pol }));
    console.log(` - Inline: ${pol}`);
    console.log(decodeURIComponent(polDetail.PolicyDocument));
  }
}

async function run() {
  await inspectRolePolicies('CloudCampus-Lambda-Execution-Role');
  await inspectRolePolicies('CloudCampus-EC2-Role');
}

run().catch(console.error);
