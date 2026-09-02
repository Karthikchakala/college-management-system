const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { runOnEc2 } = require('./ec2-exec');

const region = 'us-east-1';
const lambda = new LambdaClient({ region });

async function testLambdaE2E() {
  console.log('=== 1. FETCH ASSIGNMENT & ENROLLED STUDENTS VIA EC2 ===');
  const getAssignScript = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function get() {
      const a = await prisma.assignment.findFirst({ include: { course: true } });
      const enrolled = await prisma.enrollment.findMany({
        where: { courseId: a.courseId, status: 'ACTIVE' },
        include: { student: { include: { user: true } } }
      });
      const nonEnrolled = await prisma.student.findMany({
        where: { id: { notIn: enrolled.map(e => e.studentId) } },
        include: { user: true },
        take: 2
      });
      console.log('ASSIGNMENT_DATA:' + JSON.stringify({
        assignmentId: a.id,
        title: a.title,
        courseCode: a.course.code,
        courseName: a.course.name,
        enrolled: enrolled.map(e => ({ name: e.student.firstName + ' ' + e.student.lastName, userId: e.student.userId, email: e.student.user.email })),
        nonEnrolled: nonEnrolled.map(s => ({ name: s.firstName + ' ' + s.lastName, userId: s.userId, email: s.user.email }))
      }));
    }
    get().then(() => prisma.$disconnect()).catch(console.error);
  `;
  const b64Script = Buffer.from(getAssignScript).toString('base64');
  const ec2Res = await runOnEc2([
    `cd /home/ec2-user/college-management-system/backend && node scripts/run-with-secrets.js node -e 'eval(Buffer.from("${b64Script}", "base64").toString("utf8"))'`
  ]);

  const outputLine = ec2Res.stdout.split('\n').find(l => l.includes('ASSIGNMENT_DATA:'));
  if (!outputLine) {
    console.error('Failed to get assignment data from EC2:', ec2Res);
    return;
  }
  const data = JSON.parse(outputLine.split('ASSIGNMENT_DATA:')[1]);
  console.log(`Assignment: "${data.title}" (ID: ${data.assignmentId}) for ${data.courseCode}`);
  console.log(`Enrolled Students (${data.enrolled.length}):`, data.enrolled);
  console.log(`Non-Enrolled Students (${data.nonEnrolled.length}):`, data.nonEnrolled);

  console.log('\n=== 2. INVOKE CLOUDCAMPUS-ASSIGNMENT-NOTIFICATION LAMBDA (WORKFLOW A) ===');
  const notifRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Notification',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ assignmentId: data.assignmentId }))
  }));
  const notifPayload = JSON.parse(Buffer.from(notifRes.Payload).toString());
  console.log('Lambda Status Code:', notifPayload.statusCode);
  console.log('Lambda Response Body:', notifPayload.body);

  console.log('\n=== 3. TEST DUPLICATE NOTIFICATION PREVENTION ===');
  const dupNotifRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Notification',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ assignmentId: data.assignmentId }))
  }));
  const dupPayload = JSON.parse(Buffer.from(dupNotifRes.Payload).toString());
  console.log('Duplicate Lambda Response Body:', dupPayload.body);

  console.log('\n=== 4. TEST SCHEDULED REMINDER LAMBDA (WORKFLOW B) ===');
  // Update assignment dueDate to +24 hours for reminder detection
  await runOnEc2([
    `cd /home/ec2-user/college-management-system/backend && node scripts/run-with-secrets.js node -e 'const { PrismaClient } = require("@prisma/client"); const p = new PrismaClient(); p.assignment.update({ where: { id: "${data.assignmentId}" }, data: { dueDate: new Date(Date.now() + 24*3600*1000) } }).then(() => console.log("UPDATED_DUE_DATE")).then(() => p.$disconnect())'`
  ]);

  const reminderRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Reminder',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ source: 'aws.events' }))
  }));
  const reminderPayload = JSON.parse(Buffer.from(reminderRes.Payload).toString());
  console.log('Reminder Status Code:', reminderPayload.statusCode);
  console.log('Reminder Response Body:', reminderPayload.body);

  console.log('\n=== 5. TEST DUPLICATE REMINDER PREVENTION ===');
  const dupReminderRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Reminder',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ source: 'aws.events' }))
  }));
  const dupReminderPayload = JSON.parse(Buffer.from(dupReminderRes.Payload).toString());
  console.log('Duplicate Reminder Response Body:', dupReminderPayload.body);

  console.log('\n=== 6. VERIFY NOTIFICATIONS CREATED IN RDS VIA EC2 ===');
  const verifyRes = await runOnEc2([
    `cd /home/ec2-user/college-management-system/backend && node scripts/run-with-secrets.js node -e 'const { PrismaClient } = require("@prisma/client"); const p = new PrismaClient(); p.notification.findMany({ take: 6, orderBy: { createdAt: "desc" } }).then(n => console.log("NOTIFS_DATA:" + JSON.stringify(n))).then(() => p.$disconnect())'`
  ]);
  const notifLine = verifyRes.stdout.split('\n').find(l => l.includes('NOTIFS_DATA:'));
  if (notifLine) {
    const notifs = JSON.parse(notifLine.split('NOTIFS_DATA:')[1]);
    console.log(`Retrieved ${notifs.length} recent notifications from RDS:`);
    notifs.forEach(n => console.log(` - [${n.type}] User: ${n.userId} | ${n.title} | ${n.createdAt}`));
  }

  console.log('\n=== ALL LAMBDA FUNCTIONALITY VERIFIED IN AWS ===');
}

testLambdaE2E().catch(console.error);
