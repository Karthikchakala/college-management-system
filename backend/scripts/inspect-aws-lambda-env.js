const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { IAMClient, ListRolesCommand } = require('@aws-sdk/client-iam');
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds');
const { EC2Client, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');

const region = 'us-east-1';
const lambda = new LambdaClient({ region });
const iam = new IAMClient({ region });
const rds = new RDSClient({ region });
const ec2 = new EC2Client({ region });

async function inspectAwsResources() {
  console.log('=== 1. EXISTING LAMBDA FUNCTIONS ===');
  try {
    const funcs = await lambda.send(new ListFunctionsCommand({}));
    funcs.Functions?.forEach(f => {
      console.log(`- ${f.FunctionName} (${f.Runtime}, ${f.MemorySize}MB, State: ${f.State || 'Active'}) -> ARN: ${f.FunctionArn}`);
    });
  } catch (e) {
    console.error('Lambda error:', e.message);
  }

  console.log('\n=== 2. RDS DATABASE DETAILS ===');
  try {
    const dbs = await rds.send(new DescribeDBInstancesCommand({ DBInstanceIdentifier: 'cloudcampus-db' }));
    const inst = dbs.DBInstances?.[0];
    if (inst) {
      console.log(`- DB Identifier: ${inst.DBInstanceIdentifier}`);
      console.log(`- Endpoint: ${inst.Endpoint?.Address}:${inst.Endpoint?.Port}`);
      console.log(`- VPC ID: ${inst.DBSubnetGroup?.VpcId}`);
      console.log(`- Subnets:`, inst.DBSubnetGroup?.Subnets?.map(s => s.SubnetIdentifier));
      console.log(`- Security Groups:`, inst.VpcSecurityGroups?.map(sg => `${sg.VpcSecurityGroupId} (${sg.Status})`));
      console.log(`- Publicly Accessible:`, inst.PubliclyAccessible);
    }
  } catch (e) {
    console.error('RDS error:', e.message);
  }

  console.log('\n=== 3. RELEVANT IAM ROLES ===');
  try {
    const roles = await iam.send(new ListRolesCommand({}));
    const campusRoles = roles.Roles?.filter(r => r.RoleName.toLowerCase().includes('campus') || r.RoleName.toLowerCase().includes('lambda'));
    campusRoles?.forEach(r => console.log(`- ${r.RoleName} -> ARN: ${r.Arn}`));
  } catch (e) {
    console.error('IAM error:', e.message);
  }
}

inspectAwsResources();
