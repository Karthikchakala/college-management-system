const { EC2Client, DescribeVpcEndpointsCommand } = require('@aws-sdk/client-ec2');

const ec2 = new EC2Client({ region: 'us-east-1' });

async function inspectVpce() {
  const res = await ec2.send(new DescribeVpcEndpointsCommand({
    VpcEndpointIds: ['vpce-03453d022c9090b54', 'vpce-01779161bced06bc7']
  }));
  for (const vpce of res.VpcEndpoints) {
    console.log(`=== VPCE: ${vpce.VpcEndpointId} (${vpce.ServiceName}) ===`);
    console.log('State:', vpce.State);
    console.log('Subnets:', vpce.SubnetIds);
    console.log('Groups:', vpce.Groups);
    console.log('PrivateDnsEnabled:', vpce.PrivateDnsEnabled);
  }
}

inspectVpce().catch(console.error);
