const { EC2Client, AuthorizeSecurityGroupIngressCommand, ModifyVpcEndpointCommand } = require('@aws-sdk/client-ec2');
const { LambdaClient, UpdateFunctionConfigurationCommand } = require('@aws-sdk/client-lambda');

const region = 'us-east-1';
const ec2 = new EC2Client({ region });
const lambda = new LambdaClient({ region });

const ALL_SUBNETS = [
  'subnet-0ea7b2a7ac8952aa9',
  'subnet-02f2f01a92b63d057',
  'subnet-030b656a0b401b23d',
  'subnet-0b8c7db479db1b113'
];

const ALL_SGS = [
  'sg-05b0adcaad20ea66f',
  'sg-084f06c983a45c8b6'
];

async function alignNetworkConfig() {
  console.log('=== 1. ALLOW PORT 443 AND ALL INTERNAL TRAFFIC ON CloudCampus-EC2-SG ===');
  try {
    await ec2.send(new AuthorizeSecurityGroupIngressCommand({
      GroupId: 'sg-05b0adcaad20ea66f',
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '10.0.0.0/16' }]
        },
        {
          IpProtocol: '-1',
          UserIdGroupPairs: [
            { GroupId: 'sg-084f06c983a45c8b6' },
            { GroupId: 'sg-05b0adcaad20ea66f' }
          ]
        }
      ]
    }));
    console.log('Ingress rules added to sg-05b0adcaad20ea66f');
  } catch (err) {
    console.log('Notice SG rules:', err.message);
  }

  console.log('\n=== 2. UPDATE SECRETS MANAGER VPC ENDPOINT TO INCLUDE ALL SUBNETS & SGS ===');
  try {
    await ec2.send(new ModifyVpcEndpointCommand({
      VpcEndpointId: 'vpce-03453d022c9090b54',
      AddSubnetIds: ['subnet-0ea7b2a7ac8952aa9', 'subnet-02f2f01a92b63d057'],
      AddSecurityGroupIds: ['sg-084f06c983a45c8b6']
    }));
    console.log('Updated vpce-03453d022c9090b54');
  } catch (err) {
    console.log('Notice VPCE update:', err.message);
  }

  console.log('\n=== 3. UPDATE SNS VPC ENDPOINT TO INCLUDE ALL SUBNETS & SGS ===');
  try {
    await ec2.send(new ModifyVpcEndpointCommand({
      VpcEndpointId: 'vpce-01779161bced06bc7',
      AddSubnetIds: ['subnet-030b656a0b401b23d', 'subnet-0b8c7db479db1b113'],
      AddSecurityGroupIds: ['sg-05b0adcaad20ea66f']
    }));
    console.log('Updated vpce-01779161bced06bc7');
  } catch (err) {
    console.log('Notice VPCE update:', err.message);
  }

  console.log('\n=== 4. UPDATE LAMBDAS VPC CONFIGURATION ===');
  for (const fn of ['CloudCampus-Assignment-Notification', 'CloudCampus-Assignment-Reminder']) {
    console.log(`Updating ${fn}...`);
    await lambda.send(new UpdateFunctionConfigurationCommand({
      FunctionName: fn,
      VpcConfig: {
        SubnetIds: ALL_SUBNETS,
        SecurityGroupIds: ALL_SGS
      }
    }));
    console.log(`✓ Updated ${fn}`);
  }

  console.log('\n=== NETWORK ALIGNMENT COMPLETED ===');
}

alignNetworkConfig().catch(console.error);
