const { CloudWatchClient, ListDashboardsCommand, DescribeAlarmsCommand } = require('@aws-sdk/client-cloudwatch');
const { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } = require('@aws-sdk/client-elastic-load-balancing-v2');
const { ApiGatewayV2Client, GetApisCommand } = require('@aws-sdk/client-apigatewayv2');

const region = 'us-east-1';
const cw = new CloudWatchClient({ region });
const alb = new ElasticLoadBalancingV2Client({ region });
const apigw = new ApiGatewayV2Client({ region });

async function inspectMonitoringResources() {
  console.log('=== 1. CLOUDWATCH DASHBOARDS ===');
  const dRes = await cw.send(new ListDashboardsCommand({}));
  dRes.DashboardEntries?.forEach(d => console.log(` - ${d.DashboardName} (LastModified: ${d.LastModified})`));

  console.log('\n=== 2. CLOUDWATCH ALARMS ===');
  const aRes = await cw.send(new DescribeAlarmsCommand({}));
  aRes.MetricAlarms?.forEach(a => console.log(` - ${a.AlarmName} (${a.MetricName}, State: ${a.StateValue})`));

  console.log('\n=== 3. ALB & TARGET GROUPS ===');
  const albRes = await alb.send(new DescribeLoadBalancersCommand({}));
  for (const lb of albRes.LoadBalancers || []) {
    console.log(` - ALB: ${lb.LoadBalancerName} (ARN: ${lb.LoadBalancerArn})`);
    const tgRes = await alb.send(new DescribeTargetGroupsCommand({ LoadBalancerArn: lb.LoadBalancerArn }));
    tgRes.TargetGroups?.forEach(tg => console.log(`    -> TG: ${tg.TargetGroupName} (ARN: ${tg.TargetGroupArn})`));
  }

  console.log('\n=== 4. API GATEWAY HTTP APIS ===');
  const apiRes = await apigw.send(new GetApisCommand({}));
  apiRes.Items?.forEach(api => console.log(` - API: ${api.Name} (ID: ${api.ApiId}, Protocol: ${api.ProtocolType})`));
}

inspectMonitoringResources().catch(console.error);
