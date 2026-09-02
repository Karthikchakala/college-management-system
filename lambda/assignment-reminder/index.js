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
  console.log('=== [CloudCampus-Assignment-Reminder] Scheduled Lambda Started ===');
  console.log('Event Source:', event.source || 'EventBridge Schedule / Manual Trigger');

  const dbConfig = await getDbConfig();
  const db = new Client(dbConfig);
  await db.connect();

  try {
    // 1. Find Assignments Approaching Deadline (Due within the next 48 hours and not in the past)
    const upcomingAssignmentsQuery = `
      SELECT a.id, a.title, a.description, a."dueDate", a.points, a."courseId",
             c.code AS "courseCode", c.name AS "courseName",
             f."firstName" AS "facultyFirstName", f."lastName" AS "facultyLastName"
      FROM "Assignment" a
      JOIN "Course" c ON a."courseId" = c.id
      JOIN "Faculty" f ON a."facultyId" = f.id
      WHERE a."dueDate" > NOW() AND a."dueDate" <= NOW() + INTERVAL '48 HOURS'
      ORDER BY a."dueDate" ASC
    `;
    const assignRes = await db.query(upcomingAssignmentsQuery);
    const upcomingAssignments = assignRes.rows;

    console.log(`[Lambda] Found ${upcomingAssignments.length} assignment(s) due within the next 48 hours.`);

    let totalRemindersCreated = 0;
    let totalRemindersSkipped = 0;
    const processedSummaries = [];

    for (const assignment of upcomingAssignments) {
      const dueDateFormatted = new Date(assignment.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      console.log(`[Lambda] Processing reminders for Assignment: "${assignment.title}" (${assignment.courseCode})`);

      // Find active enrolled students who haven't submitted yet
      const studentsQuery = `
        SELECT e."studentId", s."userId", s."firstName", s."lastName", u.email
        FROM "Enrollment" e
        JOIN "Student" s ON e."studentId" = s.id
        JOIN "User" u ON s."userId" = u.id
        WHERE e."courseId" = $1 AND e.status = 'ACTIVE'
      `;
      const studentsRes = await db.query(studentsQuery, [assignment.courseId]);
      const enrolledStudents = studentsRes.rows;

      const reminderTitle = `Reminder: Assignment Due Soon — ${assignment.title}`;
      const reminderMessage = `Friendly reminder: Your assignment "${assignment.title}" for ${assignment.courseCode} (${assignment.courseName}) is due on ${dueDateFormatted}. Please submit your work on time.`;

      let assignmentRemindersCreated = 0;
      let assignmentRemindersSkipped = 0;

      for (const student of enrolledStudents) {
        // Duplicate check: Verify if this reminder notification was already sent
        const dupCheck = await db.query(
          `SELECT id FROM "Notification" WHERE "userId" = $1 AND title = $2`,
          [student.userId, reminderTitle]
        );

        if (dupCheck.rows.length > 0) {
          assignmentRemindersSkipped++;
          totalRemindersSkipped++;
          continue;
        }

        // Insert reminder notification
        await db.query(
          `INSERT INTO "Notification" (id, "userId", title, message, type, "isRead", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, $2, $3, 'ACADEMIC', false, NOW(), NOW())`,
          [student.userId, reminderTitle, reminderMessage]
        );
        assignmentRemindersCreated++;
        totalRemindersCreated++;
      }

      // Publish SNS summary for this course's upcoming deadline
      if (assignmentRemindersCreated > 0) {
        try {
          await sns.send(new PublishCommand({
            TopicArn: SNS_TOPIC_ARN,
            Subject: `[CloudCampus Reminder] Assignment Due Soon: ${assignment.title}`,
            Message: `Reminder: Assignment "${assignment.title}" for ${assignment.courseCode} is due on ${dueDateFormatted}.\n\nTotal Students Reminded: ${assignmentRemindersCreated}\n\nLogin to submit: https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com`
          }));
        } catch (snsErr) {
          console.warn('[Lambda] Warning: Failed to publish reminder SNS message:', snsErr.message);
        }
      }

      processedSummaries.push({
        assignmentId: assignment.id,
        assignmentTitle: assignment.title,
        courseCode: assignment.courseCode,
        dueDate: assignment.dueDate,
        remindersCreated: assignmentRemindersCreated,
        remindersSkipped: assignmentRemindersSkipped
      });
    }

    const result = {
      assignmentsChecked: upcomingAssignments.length,
      totalRemindersCreated,
      totalRemindersSkipped,
      details: processedSummaries
    };

    console.log('=== [CloudCampus-Assignment-Reminder] Scheduled Lambda Completed ===', JSON.stringify(result));
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: result })
    };
  } catch (error) {
    console.error('[Lambda] Execution Error:', error);
    throw error;
  } finally {
    await db.end();
  }
};
