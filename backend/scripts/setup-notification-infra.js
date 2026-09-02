const { SNSClient, CreateTopicCommand, ListTopicsCommand } = require('@aws-sdk/client-sns');
const { IAMClient, PutRolePolicyCommand, AttachRolePolicyCommand } = require('@aws-sdk/client-iam');
const { EC2Client, CreateVpcEndpointCommand, DescribeVpcEndpointsCommand } = require('@aws-sdk/client-ec2');

const region = 'us-east-1';
const sns = new SNSClient({ region });
const iam = new IAMClient({ region });
const ec2 = new EC2Client({ region });

async function setupInfrastructure() {
  console.log('=== 1. ENSURE SNS TOPIC ===');
  const topicRes = await sns.send(new CreateTopicCommand({ Name: 'CloudCampus-Notifications' }));
  const topicArn = topicRes.TopicArn;
  console.log('SNS Topic ARN:', topicArn);

  console.log('\n=== 2. ATTACH SNS PUBLISH TO LAMBDA ROLE ===');
  await iam.send(new PutRolePolicyCommand({
    RoleName: 'CloudCampus-Lambda-Execution-Role',
    PolicyName: 'CloudCampus-SNS-Publish',
    PolicyDocument: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['sns:Publish'],
          Resource: '*'
        }
      ]
    })
  }));
  console.log('Attached CloudCampus-SNS-Publish to CloudCampus-Lambda-Execution-Role');

  console.log('\n=== 3. ATTACH LAMBDA INVOKE TO EC2 ROLE ===');
  await iam.send(new PutRolePolicyCommand({
    RoleName: 'CloudCampus-EC2-Role',
    PolicyName: 'CloudCampus-EC2-Invoke-Lambda',
    PolicyDocument: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['lambda:InvokeFunction', 'lambda:InvokeAsync'],
          Resource: 'arn:aws:lambda:us-east-1:511225358997:function:CloudCampus-*'
        }
      ]
    })
  }));
  console.log('Attached CloudCampus-EC2-Invoke-Lambda to CloudCampus-EC2-Role');

  console.log('\n=== 4. CHECK / CREATE SNS VPC ENDPOINT ===');
  const vpcId = 'vpc-0146f9a06bf1163a6';
  const vpceRes = await ec2.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
  const existingSnsVpce = vpceRes.VpcEndpoints?.find(e => e.ServiceName === 'com.amazonaws.us-east-1.sns');
  if (existingSnsVpce) {
    console.log('SNS VPC Endpoint already exists:', existingSnsVpce.VpcEndpointId);
  } else {
    console.log('Creating SNS VPC Endpoint in VPC:', vpcId);
    try {
      const newVpce = await ec2.send(new CreateVpcEndpointCommand({
        VpcId: vpcId,
        ServiceName: 'com.amazonaws.us-east-1.sns',
        VpcEndpointType: 'Interface',
        SubnetIds: ['subnet-0ea7b2a7ac8952aa9', 'subnet-02f2f01a92b63d057'],
        SecurityGroupIds: ['sg-084f06c983a45c8b6'],
        PrivateDnsEnabled: true
      }));
      console.log('Created SNS VPC Endpoint:', newVpce.VpcEndpoint?.VpcEndpointId);
    } catch (err) {
      console.warn('VPC Endpoint creation notice:', err.message);
    }
  }

  console.log('\n=== INFRASTRUCTURE SETUP COMPLETED ===');
}

setupInfrastructure().catch(console.error);
