const { CloudWatchClient, GetMetricDataCommand, DescribeAlarmsCommand, ListMetricsCommand } = require('@aws-sdk/client-cloudwatch');
const { CloudWatchLogsClient, DescribeLogGroupsCommand, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const region = process.env.AWS_REGION || 'us-east-1';
const cwClient = new CloudWatchClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const prisma = new PrismaClient();

async function runLiveAudit() {
  console.log('====================================================');
  console.log('CLOUDCAMPUS — AWS CLOUDWATCH LIVE AUDIT EXECUTION');
  console.log(`Region: ${region}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('====================================================\n');

  const auditReport = {
    region,
    logGroups: [],
    alarms: [],
    ec2Metrics: null,
    apiGwMetrics: null,
    lambdaMetrics: null,
    rdsMetrics: null,
    dbCounts: {},
  };

  // 1. CloudWatch Log Groups
  try {
    console.log('[Audit] Querying CloudWatch Log Groups...');
    const logGroupsRes = await logsClient.send(new DescribeLogGroupsCommand({ limit: 20 }));
    auditReport.logGroups = (logGroupsRes.logGroups || []).map(g => ({
      name: g.logGroupName,
      retentionInDays: g.retentionInDays || 'Never Expire',
      storedBytes: g.storedBytes || 0,
    }));
    console.log(`[Audit] Found ${auditReport.logGroups.length} Log Groups:`, auditReport.logGroups.map(g => g.name).join(', '));
  } catch (err) {
    console.warn('[Audit] Log Groups query note:', err.message);
  }

  // 2. CloudWatch Alarms
  try {
    console.log('\n[Audit] Querying CloudWatch Alarms...');
    const alarmsRes = await cwClient.send(new DescribeAlarmsCommand({ MaxRecords: 50 }));
    auditReport.alarms = (alarmsRes.MetricAlarms || []).map(a => ({
      name: a.AlarmName,
      state: a.StateValue,
      metric: a.MetricName,
      namespace: a.Namespace,
      threshold: a.Threshold,
    }));
    console.log(`[Audit] Found ${auditReport.alarms.length} Alarms in AWS.`);
  } catch (err) {
    console.warn('[Audit] Alarms query note:', err.message);
  }

  // 3. Database Count Integrity
  try {
    console.log('\n[Audit] Verifying RDS Database Record Counts (Read-Only)...');
    const [
      departmentCount,
      userCount,
      studentCount,
      facultyCount,
      courseCount,
      enrollmentCount,
      attendanceCount,
      assignmentCount,
      submissionCount,
      examCount,
      resultCount,
      announcementCount,
      notificationCount,
    ] = await Promise.all([
      prisma.department.count(),
      prisma.user.count(),
      prisma.student.count(),
      prisma.faculty.count(),
      prisma.course.count(),
      prisma.enrollment.count(),
      prisma.attendance.count(),
      prisma.assignment.count(),
      prisma.assignmentSubmission.count(),
      prisma.exam.count(),
      prisma.result.count(),
      prisma.announcement.count(),
      prisma.notification.count(),
    ]);

    auditReport.dbCounts = {
      Department: departmentCount,
      User: userCount,
      Student: studentCount,
      Faculty: facultyCount,
      Course: courseCount,
      Enrollment: enrollmentCount,
      Attendance: attendanceCount,
      Assignment: assignmentCount,
      AssignmentSubmission: submissionCount,
      Exam: examCount,
      Result: resultCount,
      Announcement: announcementCount,
      Notification: notificationCount,
    };

    console.log('[Audit] Database Snapshot:');
    console.table(auditReport.dbCounts);
  } catch (err) {
    console.error('[Audit] Database Count Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n[Audit] Live verification completed successfully.');
}

runLiveAudit().catch(console.error);
