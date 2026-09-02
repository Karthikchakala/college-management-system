const { LambdaClient, ListFunctionsCommand } = require('@aws-sdk/client-lambda');
const { SNSClient, ListTopicsCommand } = require('@aws-sdk/client-sns');
const { EventBridgeClient, ListRulesCommand } = require('@aws-sdk/client-eventbridge');
const { IAMClient, ListRolesCommand } = require('@aws-sdk/client-iam');
const { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } = require('@aws-sdk/client-ec2');

const region = 'us-east-1';
const lambda = new LambdaClient({ region });
const sns = new SNSClient({ region });
const eventbridge = new EventBridgeClient({ region });
const iam = new IAMClient({ region });
const ec2 = new EC2Client({ region });

async function inspectAws() {
  console.log('=== 1. LAMBDA FUNCTIONS ===');
  const fnRes = await lambda.send(new ListFunctionsCommand({}));
  fnRes.Functions?.forEach(f => console.log(` - ${f.FunctionName} (${f.Runtime}, ${f.Role})`));

  console.log('\n=== 2. SNS TOPICS ===');
  const snsRes = await sns.send(new ListTopicsCommand({}));
  snsRes.Topics?.forEach(t => console.log(` - ${t.TopicArn}`));

  console.log('\n=== 3. EVENTBRIDGE RULES ===');
  const ebRes = await eventbridge.send(new ListRulesCommand({}));
  ebRes.Rules?.forEach(r => console.log(` - ${r.Name} (${r.ScheduleExpression || r.State})`));

  console.log('\n=== 4. RELEVANT IAM ROLES ===');
  const iamRes = await iam.send(new ListRolesCommand({}));
  iamRes.Roles?.filter(r => r.RoleName.toLowerCase().includes('cloudcampus') || r.RoleName.toLowerCase().includes('lambda'))
    .forEach(r => console.log(` - ${r.RoleName} (${r.Arn})`));

  console.log('\n=== 5. VPC & SUBNETS FOR RDS & LAMBDA ===');
  const vpcRes = await ec2.send(new DescribeVpcsCommand({}));
  vpcRes.Vpcs?.forEach(v => console.log(` - VPC: ${v.VpcId} (Default: ${v.IsDefault})`));

  const sgs = await ec2.send(new DescribeSecurityGroupsCommand({}));
  sgs.SecurityGroups?.filter(s => s.GroupName.toLowerCase().includes('cloudcampus') || s.GroupName.toLowerCase().includes('rds') || s.GroupName.toLowerCase().includes('default'))
    .forEach(s => console.log(` - SG: ${s.GroupId} (${s.GroupName})`));
}

inspectAws().catch(console.error);
