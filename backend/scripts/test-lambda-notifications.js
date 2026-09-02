const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { Client } = require('pg');

const region = 'us-east-1';
const lambda = new LambdaClient({ region });
const secrets = new SecretsManagerClient({ region });

async function getDbClient() {
  const secretRes = await secrets.send(new GetSecretValueCommand({ SecretId: 'cloudcampus/rds' }));
  const secret = JSON.parse(secretRes.SecretString);
  const client = new Client({
    host: secret.host || secret.endpoint || 'cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com',
    port: secret.port ? parseInt(secret.port) : 5432,
    user: secret.username || 'postgres',
    password: secret.password,
    database: secret.database || secret.dbname || 'campusadmin',
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

async function testWorkflow() {
  console.log('=== 1. FETCH AN ACTIVE ASSIGNMENT & ENROLLED STUDENTS FROM RDS ===');
  const db = await getDbClient();

  const assignRes = await db.query(`
    SELECT a.id, a.title, a."courseId", c.code, c.name
    FROM "Assignment" a
    JOIN "Course" c ON a."courseId" = c.id
    LIMIT 1
  `);

  if (assignRes.rows.length === 0) {
    console.error('No assignments found in RDS.');
    await db.end();
    return;
  }

  const assignment = assignRes.rows[0];
  console.log(`Testing with Assignment ID: ${assignment.id} ("${assignment.title}" - ${assignment.code})`);

  // Check enrolled students
  const enrolledRes = await db.query(`
    SELECT e."studentId", s."userId", s."firstName", s."lastName"
    FROM "Enrollment" e
    JOIN "Student" s ON e."studentId" = s.id
    WHERE e."courseId" = $1 AND e.status = 'ACTIVE'
  `, [assignment.courseId]);
  console.log(`Enrolled students for ${assignment.code}:`, enrolledRes.rows.map(s => `${s.firstName} ${s.lastName} (${s.userId})`));

  // Check non-enrolled students
  const nonEnrolledRes = await db.query(`
    SELECT s."userId", s."firstName", s."lastName"
    FROM "Student" s
    WHERE s.id NOT IN (
      SELECT e."studentId" FROM "Enrollment" e WHERE e."courseId" = $1 AND e.status = 'ACTIVE'
    )
    LIMIT 2
  `, [assignment.courseId]);
  console.log('Non-enrolled sample students:', nonEnrolledRes.rows.map(s => `${s.firstName} ${s.lastName} (${s.userId})`));

  console.log('\n=== 2. INVOKE CLOUDCAMPUS-ASSIGNMENT-NOTIFICATION LAMBDA ===');
  const notifRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Notification',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ assignmentId: assignment.id }))
  }));

  const notifResultStr = Buffer.from(notifRes.Payload).toString();
  console.log('Notification Lambda Response:', notifResultStr);

  console.log('\n=== 3. TEST DUPLICATE NOTIFICATION PREVENTION ===');
  const dupNotifRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Notification',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ assignmentId: assignment.id }))
  }));
  console.log('Duplicate Execution Response:', Buffer.from(dupNotifRes.Payload).toString());

  console.log('\n=== 4. TEST SCHEDULED REMINDER LAMBDA (WORKFLOW B) ===');
  // First ensure there is at least one upcoming assignment due in 24 hours for reminder test
  const ensureUpcoming = await db.query(`
    UPDATE "Assignment"
    SET "dueDate" = NOW() + INTERVAL '24 HOURS'
    WHERE id = $1
    RETURNING id, title, "dueDate"
  `, [assignment.id]);
  console.log('Updated test assignment dueDate to +24h:', ensureUpcoming.rows[0]);

  const reminderRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Reminder',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ source: 'aws.events' }))
  }));
  console.log('Reminder Lambda Response:', Buffer.from(reminderRes.Payload).toString());

  console.log('\n=== 5. TEST DUPLICATE REMINDER PREVENTION ===');
  const dupReminderRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Reminder',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ source: 'aws.events' }))
  }));
  console.log('Duplicate Reminder Execution Response:', Buffer.from(dupReminderRes.Payload).toString());

  console.log('\n=== 6. VERIFY NOTIFICATIONS IN RDS ===');
  const recentNotifs = await db.query(`
    SELECT n.id, n."userId", n.title, n.message, n.type, n."createdAt"
    FROM "Notification" n
    ORDER BY n."createdAt" DESC
    LIMIT 5
  `);
  console.log('Recent Notifications in RDS:');
  recentNotifs.rows.forEach(n => {
    console.log(` - [${n.type}] User: ${n.userId} | ${n.title}`);
  });

  await db.end();
  console.log('\n=== ALL LAMBDA WORKFLOW TESTS PASSED ===');
}

testWorkflow().catch(console.error);
