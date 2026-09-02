const { ApiGatewayV2Client, GetRoutesCommand, CreateIntegrationCommand, UpdateRouteCommand, CreateDeploymentCommand } = require('@aws-sdk/client-apigatewayv2');
const client = new ApiGatewayV2Client({ region: 'us-east-1' });

const API_ID = '7k2yo6gy77';

async function fixRoutes() {
  const routes = await client.send(new GetRoutesCommand({ ApiId: API_ID }));
  console.log('Routes:', routes.Items.map(r => ({ RouteId: r.RouteId, RouteKey: r.RouteKey, Target: r.Target })));

  // 1. Create a dedicated HTTP_PROXY integration for /{proxy+}
  const proxyInt = await client.send(new CreateIntegrationCommand({
    ApiId: API_ID,
    IntegrationType: 'HTTP_PROXY',
    IntegrationMethod: 'ANY',
    IntegrationUri: 'http://CloudCampus-ALB-1161527073.us-east-1.elb.amazonaws.com/{proxy}',
    PayloadFormatVersion: '1.0',
    Description: 'HTTP proxy forwarding to ALB with greedy path',
  }));
  console.log('Created Proxy Integration:', proxyInt.IntegrationId);

  // 2. Update Route ANY /{proxy+} to point to this new integration
  const proxyRoute = routes.Items.find(r => r.RouteKey === 'ANY /{proxy+}');
  if (proxyRoute) {
    const upRoute = await client.send(new UpdateRouteCommand({
      ApiId: API_ID,
      RouteId: proxyRoute.RouteId,
      Target: `integrations/${proxyInt.IntegrationId}`,
    }));
    console.log('Updated Route ANY /{proxy+} to target:', upRoute.Target);
  }

  // 3. Deploy stage prod
  const dep = await client.send(new CreateDeploymentCommand({
    ApiId: API_ID,
    StageName: 'prod',
    Description: 'Deploy greedy proxy forwarding to ALB',
  }));
  console.log('Deployment ID:', dep.DeploymentId);
}

fixRoutes().catch(console.error);
