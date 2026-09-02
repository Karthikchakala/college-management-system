const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { Client } = require('pg');

const region = process.env.AWS_REGION || 'us-east-1';
const secretsManager = new SecretsManagerClient({ region });
const sns = new SNSClient({ region });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || 'arn:aws:sns:us-east-1:511225358997:CloudCampus-Notifications';

let cachedDbConfig = null;

async function getDbConfig() {
  if (cachedDbConfig) return cachedDbConfig;
  console.log('[Lambda] Fetching DB credentials from AWS Secrets Manager: cloudcampus/rds');
  const res = await secretsManager.send(new GetSecretValueCommand({ SecretId: 'cloudcampus/rds' }));
  const secret = JSON.parse(res.SecretString);
  cachedDbConfig = {
    host: secret.host || secret.endpoint || 'cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com',
    port: secret.port ? parseInt(secret.port) : 5432,
    user: secret.username || 'postgres',
    password: secret.password,
    database: secret.database || secret.dbname || 'campusadmin',
    ssl: { rejectUnauthorized: false }
  };
  return cachedDbConfig;
}

exports.handler = async (event) => {
  console.log('=== [CloudCampus-Assignment-Notification] Lambda Started ===');
  console.log('Event Payload:', JSON.stringify(event));

  const assignmentId = event.assignmentId || (event.Records && event.Records[0]?.body ? JSON.parse(event.Records[0].body).assignmentId : null);

  if (!assignmentId) {
    console.error('Error: Missing assignmentId in event');
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing assignmentId' }) };
  }

  const dbConfig = await getDbConfig();
  const db = new Client(dbConfig);
  await db.connect();

  try {
    // 1. Query Assignment Details
    const assignmentQuery = `
      SELECT a.id, a.title, a.description, a."dueDate", a.points, a."courseId",
             c.code AS "courseCode", c.name AS "courseName",
             f."firstName" AS "facultyFirstName", f."lastName" AS "facultyLastName"
      FROM "Assignment" a
      JOIN "Course" c ON a."courseId" = c.id
      JOIN "Faculty" f ON a."facultyId" = f.id
      WHERE a.id = $1
    `;
    const assignRes = await db.query(assignmentQuery, [assignmentId]);

    if (assignRes.rows.length === 0) {
      console.warn(`[Lambda] Assignment not found with ID: ${assignmentId}`);
      return { statusCode: 404, body: JSON.stringify({ error: 'Assignment not found' }) };
    }

    const assignment = assignRes.rows[0];
    const dueDateFormatted = new Date(assignment.dueDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    console.log(`[Lambda] Processing Assignment: "${assignment.title}" for Course: ${assignment.courseCode} (${assignment.courseName})`);

    // 2. Query Enrolled Active Students for this Course
    const studentsQuery = `
      SELECT e."studentId", s."userId", s."firstName", s."lastName", u.email
      FROM "Enrollment" e
      JOIN "Student" s ON e."studentId" = s.id
      JOIN "User" u ON s."userId" = u.id
      WHERE e."courseId" = $1 AND e.status = 'ACTIVE'
    `;
    const studentsRes = await db.query(studentsQuery, [assignment.courseId]);
    const enrolledStudents = studentsRes.rows;

    console.log(`[Lambda] Identified ${enrolledStudents.length} actively enrolled student(s) for course ${assignment.courseCode}`);

    let createdCount = 0;
    let skippedCount = 0;

    const notifTitle = `New Assignment Published: ${assignment.title}`;
    const notifMessage = `Professor ${assignment.facultyFirstName} ${assignment.facultyLastName} published "${assignment.title}" for ${assignment.courseCode} (${assignment.courseName}). Due Date: ${dueDateFormatted}. Max Points: ${assignment.points}.`;

    // 3. Create Notification for Each Enrolled Student
    for (const student of enrolledStudents) {
      // Check duplicate
      const dupCheck = await db.query(
        `SELECT id FROM "Notification" WHERE "userId" = $1 AND title = $2`,
        [student.userId, notifTitle]
      );

      if (dupCheck.rows.length > 0) {
        console.log(`[Lambda] Duplicate notification skipped for student ${student.firstName} ${student.lastName} (${student.userId})`);
        skippedCount++;
        continue;
      }

      // Insert notification
      await db.query(
        `INSERT INTO "Notification" (id, "userId", title, message, type, "isRead", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, 'ACADEMIC', false, NOW(), NOW())`,
        [student.userId, notifTitle, notifMessage]
      );
      createdCount++;
      console.log(`[Lambda] Created notification for student ${student.firstName} ${student.lastName} (${student.userId})`);
    }

    // 4. Publish SNS Notification Summary
    let snsMessageId = null;
    if (enrolledStudents.length > 0) {
      try {
        const snsRes = await sns.send(new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: `[CloudCampus] New Assignment: ${assignment.title}`,
          Message: `A new assignment "${assignment.title}" has been published for ${assignment.courseCode} - ${assignment.courseName}.\n\nInstructor: ${assignment.facultyFirstName} ${assignment.facultyLastName}\nDue Date: ${dueDateFormatted}\nPoints: ${assignment.points}\n\nNotified Students: ${enrolledStudents.length}\n\nLogin to CloudCampus to view details: https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com`
        }));
        snsMessageId = snsRes.MessageId;
        console.log(`[Lambda] Published SNS notification successfully. MessageId: ${snsMessageId}`);
      } catch (snsErr) {
        console.error('[Lambda] Warning: Failed to publish SNS message:', snsErr.message);
      }
    }

    const summary = {
      assignmentId: assignment.id,
      assignmentTitle: assignment.title,
      courseCode: assignment.courseCode,
      enrolledStudentsCount: enrolledStudents.length,
      notificationsCreated: createdCount,
      notificationsSkipped: skippedCount,
      snsMessageId
    };

    console.log('=== [CloudCampus-Assignment-Notification] Lambda Completed Successfully ===', JSON.stringify(summary));
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: summary })
    };
  } catch (error) {
    console.error('[Lambda] Execution Error:', error);
    throw error;
  } finally {
    await db.end();
  }
};
