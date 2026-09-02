const { CloudWatchClient, GetDashboardCommand } = require('@aws-sdk/client-cloudwatch');

const cw = new CloudWatchClient({ region: 'us-east-1' });

async function getDashboard() {
  const res = await cw.send(new GetDashboardCommand({ DashboardName: 'CloudCampus-Monitoring' }));
  console.log('Dashboard Name:', res.DashboardName);
  console.log('Dashboard Body:\n', JSON.stringify(JSON.parse(res.DashboardBody), null, 2));
}

getDashboard().catch(console.error);
