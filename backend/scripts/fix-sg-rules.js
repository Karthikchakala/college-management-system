const { EC2Client, DescribeSecurityGroupsCommand, AuthorizeSecurityGroupIngressCommand } = require('@aws-sdk/client-ec2');

const ec2 = new EC2Client({ region: 'us-east-1' });

async function inspectSgRules() {
  const sgId = 'sg-084f06c983a45c8b6';
  const res = await ec2.send(new DescribeSecurityGroupsCommand({ GroupIds: [sgId] }));
  const sg = res.SecurityGroups[0];
  console.log('=== SG RULES FOR sg-084f06c983a45c8b6 ===');
  console.log('Ingress Rules:', JSON.stringify(sg.IpPermissions, null, 2));

  // Let's ensure sg-084f06c983a45c8b6 allows all traffic from within the VPC or from itself
  try {
    await ec2.send(new AuthorizeSecurityGroupIngressCommand({
      GroupId: sgId,
      IpPermissions: [
        {
          IpProtocol: '-1',
          UserIdGroupPairs: [{ GroupId: sgId }]
        },
        {
          IpProtocol: 'tcp',
          FromPort: 5432,
          ToPort: 5432,
          IpRanges: [{ CidrIp: '10.0.0.0/16' }]
        },
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          IpRanges: [{ CidrIp: '10.0.0.0/16' }]
        }
      ]
    }));
    console.log('Added internal VPC & self-referencing ingress rules to SG!');
  } catch (err) {
    if (err.name === 'InvalidPermission.Duplicate') {
      console.log('Rules already configured.');
    } else {
      console.warn('SG rule notice:', err.message);
    }
  }
}

inspectSgRules().catch(console.error);
