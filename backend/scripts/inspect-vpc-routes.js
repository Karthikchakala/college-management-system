const { EC2Client, DescribeRouteTablesCommand, DescribeVpcEndpointsCommand, DescribeSubnetsCommand } = require('@aws-sdk/client-ec2');

const ec2 = new EC2Client({ region: 'us-east-1' });

async function inspectVpcRoutes() {
  const vpcId = 'vpc-0146f9a06bf1163a6';
  const subRes = await ec2.send(new DescribeSubnetsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
  console.log('=== SUBNETS IN VPC ===');
  subRes.Subnets?.forEach(s => console.log(` - ${s.SubnetId} (CIDR: ${s.CidrBlock}, AZ: ${s.AvailabilityZone}, Public: ${s.MapPublicIpOnLaunch})`));

  const rtRes = await ec2.send(new DescribeRouteTablesCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
  console.log('\n=== ROUTE TABLES ===');
  rtRes.RouteTables?.forEach(rt => {
    console.log(` - RT: ${rt.RouteTableId}`);
    rt.Routes?.forEach(r => console.log(`    -> Dest: ${r.DestinationCidrBlock || r.DestinationPrefixListId}, Target: ${r.GatewayId || r.NatGatewayId || r.NetworkInterfaceId}`));
  });

  const vpceRes = await ec2.send(new DescribeVpcEndpointsCommand({ Filters: [{ Name: 'vpc-id', Values: [vpcId] }] }));
  console.log('\n=== VPC ENDPOINTS ===');
  vpceRes.VpcEndpoints?.forEach(ve => console.log(` - ${ve.VpcEndpointId} (${ve.ServiceName}, Type: ${ve.VpcEndpointType})`));
}

inspectVpcRoutes().catch(console.error);
