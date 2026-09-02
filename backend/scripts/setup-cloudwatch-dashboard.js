const { CloudWatchClient, PutDashboardCommand, PutMetricAlarmCommand } = require('@aws-sdk/client-cloudwatch');

const region = 'us-east-1';
const cw = new CloudWatchClient({ region });

const EC2_INSTANCE_ID = 'i-03681025582d882c5';
const ALB_DIM = 'app/CloudCampus-ALB/8dd3b61204d02d3a';
const TG_DIM = 'targetgroup/CloudCampus-Backend-TG/3f122f379d622c29';
const API_ID = '7k2yo6gy77';
const RDS_DB_ID = 'cloudcampus-db';
const SNS_ALARM_TOPIC = 'arn:aws:sns:us-east-1:511225358997:CloudCampus-Notifications';

async function setupDashboardAndAlarms() {
  console.log('=== 1. CREATING CLOUDWATCH DASHBOARD: CloudCampus-Monitoring ===');

  const dashboardBody = {
    widgets: [
      // Row 1: Header / System Overview
      {
        type: 'text',
        x: 0,
        y: 0,
        width: 24,
        height: 2,
        properties: {
          markdown: '# 🎓 CloudCampus — Full System CloudWatch Monitoring Dashboard\n**Architecture**: API Gateway (`7k2yo6gy77`) → ALB (`CloudCampus-ALB`) → EC2 (`i-03681025582d882c5`) → RDS PostgreSQL (`cloudcampus-db`) + AWS Lambda Event Notifications'
        }
      },
      // Row 2: EC2 Metrics
      {
        type: 'metric',
        x: 0,
        y: 2,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/EC2', 'CPUUtilization', 'InstanceId', EC2_INSTANCE_ID, { label: 'EC2 CPU Utilization (%)', color: '#1f77b4' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'EC2 CPU Utilization (%)',
          period: 300,
          stat: 'Average',
          yAxis: { left: { min: 0, max: 100 } }
        }
      },
      {
        type: 'metric',
        x: 8,
        y: 2,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/EC2', 'NetworkIn', 'InstanceId', EC2_INSTANCE_ID, { label: 'Network In (Bytes)', color: '#2ca02c' }],
            ['AWS/EC2', 'NetworkOut', 'InstanceId', EC2_INSTANCE_ID, { label: 'Network Out (Bytes)', color: '#ff7f0e' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'EC2 Network Traffic (In/Out)',
          period: 300,
          stat: 'Average'
        }
      },
      {
        type: 'metric',
        x: 16,
        y: 2,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/EC2', 'StatusCheckFailed_Instance', 'InstanceId', EC2_INSTANCE_ID, { label: 'Instance Status Check Failed', color: '#d62728' }],
            ['AWS/EC2', 'StatusCheckFailed_System', 'InstanceId', EC2_INSTANCE_ID, { label: 'System Status Check Failed', color: '#9467bd' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'EC2 Health Status Checks',
          period: 300,
          stat: 'Maximum'
        }
      },

      // Row 3: ALB & API Gateway Metrics
      {
        type: 'metric',
        x: 0,
        y: 8,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/ApplicationELB', 'RequestCount', 'LoadBalancer', ALB_DIM, { label: 'ALB Total Requests', color: '#17becf' }],
            ['AWS/ApplicationELB', 'TargetResponseTime', 'LoadBalancer', ALB_DIM, { label: 'Target Response Time (s)', color: '#bcbd22', yAxis: 'right' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'ALB Request Count & Response Time',
          period: 300,
          stat: 'Sum'
        }
      },
      {
        type: 'metric',
        x: 8,
        y: 8,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/ApplicationELB', 'HTTPCode_Target_4XX_Count', 'LoadBalancer', ALB_DIM, { label: '4XX Target Errors', color: '#ffbb78' }],
            ['AWS/ApplicationELB', 'HTTPCode_Target_5XX_Count', 'LoadBalancer', ALB_DIM, { label: '5XX Server Errors', color: '#d62728' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'ALB HTTP 4XX & 5XX Error Rates',
          period: 300,
          stat: 'Sum'
        }
      },
      {
        type: 'metric',
        x: 16,
        y: 8,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/ApiGateway', 'Count', 'ApiId', API_ID, { label: 'API Gateway Requests', color: '#393b79' }],
            ['AWS/ApiGateway', 'Latency', 'ApiId', API_ID, { label: 'Overall Latency (ms)', color: '#637939', yAxis: 'right' }],
            ['AWS/ApiGateway', 'IntegrationLatency', 'ApiId', API_ID, { label: 'Integration Latency (ms)', color: '#8c6d31', yAxis: 'right' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'API Gateway Traffic & Latency',
          period: 300,
          stat: 'Average'
        }
      },

      // Row 4: RDS PostgreSQL Metrics
      {
        type: 'metric',
        x: 0,
        y: 14,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/RDS', 'CPUUtilization', 'DBInstanceIdentifier', RDS_DB_ID, { label: 'RDS CPU (%)', color: '#1f77b4' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'RDS PostgreSQL CPU Utilization (%)',
          period: 300,
          stat: 'Average',
          yAxis: { left: { min: 0, max: 100 } }
        }
      },
      {
        type: 'metric',
        x: 8,
        y: 14,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/RDS', 'DatabaseConnections', 'DBInstanceIdentifier', RDS_DB_ID, { label: 'Active Database Connections', color: '#8c564b' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'RDS Active DB Connections',
          period: 300,
          stat: 'Average'
        }
      },
      {
        type: 'metric',
        x: 16,
        y: 14,
        width: 8,
        height: 6,
        properties: {
          metrics: [
            ['AWS/RDS', 'ReadIOPS', 'DBInstanceIdentifier', RDS_DB_ID, { label: 'Read IOPS', color: '#2ca02c' }],
            ['AWS/RDS', 'WriteIOPS', 'DBInstanceIdentifier', RDS_DB_ID, { label: 'Write IOPS', color: '#ff7f0e' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'RDS Disk I/O Activity (Read/Write IOPS)',
          period: 300,
          stat: 'Average'
        }
      },

      // Row 5: AWS Lambda Metrics
      {
        type: 'metric',
        x: 0,
        y: 20,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            ['AWS/Lambda', 'Invocations', 'FunctionName', 'CloudCampus-Assignment-Notification', { label: 'Notification Invocations', color: '#1f77b4' }],
            ['AWS/Lambda', 'Invocations', 'FunctionName', 'CloudCampus-Assignment-Reminder', { label: 'Reminder Invocations', color: '#2ca02c' }],
            ['AWS/Lambda', 'Invocations', 'FunctionName', 'CloudCampus-Backend', { label: 'Health Function Invocations', color: '#9467bd' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'AWS Lambda Total Invocations',
          period: 300,
          stat: 'Sum'
        }
      },
      {
        type: 'metric',
        x: 12,
        y: 20,
        width: 12,
        height: 6,
        properties: {
          metrics: [
            ['AWS/Lambda', 'Errors', 'FunctionName', 'CloudCampus-Assignment-Notification', { label: 'Notification Errors', color: '#d62728' }],
            ['AWS/Lambda', 'Errors', 'FunctionName', 'CloudCampus-Assignment-Reminder', { label: 'Reminder Errors', color: '#ff7f0e' }],
            ['AWS/Lambda', 'Duration', 'FunctionName', 'CloudCampus-Assignment-Notification', { label: 'Notification Duration (ms)', yAxis: 'right', color: '#17becf' }],
            ['AWS/Lambda', 'Duration', 'FunctionName', 'CloudCampus-Assignment-Reminder', { label: 'Reminder Duration (ms)', yAxis: 'right', color: '#8c6d31' }]
          ],
          view: 'timeSeries',
          stacked: false,
          region,
          title: 'Lambda Errors & Execution Duration',
          period: 300,
          stat: 'Average'
        }
      }
    ]
  };

  await cw.send(new PutDashboardCommand({
    DashboardName: 'CloudCampus-Monitoring',
    DashboardBody: JSON.stringify(dashboardBody)
  }));
  console.log('✓ CloudWatch Dashboard CloudCampus-Monitoring created/updated successfully with 11 rich widgets.');

  console.log('\n=== 2. CREATING CLOUDWATCH METRIC ALARMS ===');

  // Alarm 1: EC2 High CPU (> 80%)
  await cw.send(new PutMetricAlarmCommand({
    AlarmName: 'CloudCampus-EC2-HighCPU',
    ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    EvaluationPeriods: 2,
    MetricName: 'CPUUtilization',
    Namespace: 'AWS/EC2',
    Period: 300,
    Statistic: 'Average',
    Threshold: 80.0,
    ActionsEnabled: false,
    AlarmDescription: 'Triggers when CloudCampus EC2 instance CPU exceeds 80% for 10 minutes.',
    Dimensions: [{ Name: 'InstanceId', Value: EC2_INSTANCE_ID }]
  }));
  console.log('✓ Alarm CloudCampus-EC2-HighCPU configured.');

  // Alarm 2: ALB 5XX Errors (> 5 errors)
  await cw.send(new PutMetricAlarmCommand({
    AlarmName: 'CloudCampus-ALB-5XX-Errors',
    ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    EvaluationPeriods: 1,
    MetricName: 'HTTPCode_Target_5XX_Count',
    Namespace: 'AWS/ApplicationELB',
    Period: 300,
    Statistic: 'Sum',
    Threshold: 5.0,
    ActionsEnabled: false,
    AlarmDescription: 'Triggers when ALB target 5XX error count exceeds 5 in 5 minutes.',
    Dimensions: [{ Name: 'LoadBalancer', Value: ALB_DIM }]
  }));
  console.log('✓ Alarm CloudCampus-ALB-5XX-Errors configured.');

  // Alarm 3: RDS High CPU (> 80%)
  await cw.send(new PutMetricAlarmCommand({
    AlarmName: 'CloudCampus-RDS-HighCPU',
    ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    EvaluationPeriods: 2,
    MetricName: 'CPUUtilization',
    Namespace: 'AWS/RDS',
    Period: 300,
    Statistic: 'Average',
    Threshold: 80.0,
    ActionsEnabled: false,
    AlarmDescription: 'Triggers when CloudCampus RDS PostgreSQL CPU exceeds 80% for 10 minutes.',
    Dimensions: [{ Name: 'DBInstanceIdentifier', Value: RDS_DB_ID }]
  }));
  console.log('✓ Alarm CloudCampus-RDS-HighCPU configured.');

  // Alarm 4: Lambda Errors (>= 1 error)
  await cw.send(new PutMetricAlarmCommand({
    AlarmName: 'CloudCampus-Lambda-Errors',
    ComparisonOperator: 'GreaterThanOrEqualToThreshold',
    EvaluationPeriods: 1,
    MetricName: 'Errors',
    Namespace: 'AWS/Lambda',
    Period: 300,
    Statistic: 'Sum',
    Threshold: 1.0,
    ActionsEnabled: false,
    AlarmDescription: 'Triggers when CloudCampus notification Lambda encounters an unhandled execution error.',
    Dimensions: [{ Name: 'FunctionName', Value: 'CloudCampus-Assignment-Notification' }]
  }));
  console.log('✓ Alarm CloudCampus-Lambda-Errors configured.');

  console.log('\n=== CLOUDWATCH MONITORING & ALARMS CONFIGURATION COMPLETE ===');
}

setupDashboardAndAlarms().catch(console.error);
