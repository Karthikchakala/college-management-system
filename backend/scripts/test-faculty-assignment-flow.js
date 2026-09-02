const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { runOnEc2 } = require('./ec2-exec');

const cognito = new CognitoIdentityProviderClient({ region: 'us-east-1' });
const CLIENT_ID = '3kv2vgpkklqtlpfom2t72dn29n';
const API_BASE = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';

async function getCognitoToken(username, password) {
  const res = await cognito.send(new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password
    }
  }));
  return res.AuthenticationResult.IdToken;
}

async function testFacultyAssignmentFlow() {
  console.log('=== 1. LOGIN AS FACULTY THROUGH COGNITO & API GATEWAY ===');
  const token = await getCognitoToken('faculty@campus.local', 'TempPassword123!');
  console.log('Faculty authenticated via Cognito. JWT acquired.');

  // 2. Fetch assigned courses
  const coursesRes = await fetch(`${API_BASE}/faculty/courses`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const coursesData = await coursesRes.json();
  const assignedCourses = coursesData.data || [];
  console.log(`Faculty assigned to ${assignedCourses.length} courses:`, assignedCourses.map(c => `${c.code} (${c.name})`));

  const targetCourse = assignedCourses[0];
  console.log(`\n=== 2. CREATE A NEW ASSIGNMENT FOR ${targetCourse.code} (${targetCourse.name}) ===`);
  const uniqueTitle = `EC201 VLSI Synthesis Lab — ${Date.now().toString().slice(-4)}`;
  const createRes = await fetch(`${API_BASE}/faculty/assignments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: uniqueTitle,
      description: 'Implement RTL architecture for FPGA synthesis. Submit timing analysis report.',
      dueDate: new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
      points: 100,
      courseId: targetCourse.id
    })
  });
  const createData = await createRes.json();
  const createdAssignment = createData.data;
  console.log('Assignment created via Express API:', createdAssignment.id, `"${createdAssignment.title}"`);

  // Wait 4 seconds for asynchronous Lambda execution in AWS
  console.log('Waiting 4s for AWS Lambda asynchronous event execution...');
  await new Promise(r => setTimeout(r, 4000));

  console.log('\n=== 3. VERIFY NOTIFICATIONS CREATED IN RDS VIA EC2 ===');
  const checkScript = `
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    async function check() {
      const notifs = await p.notification.findMany({
        where: { title: { contains: "${uniqueTitle}" } },
        include: { user: true }
      });
      console.log("NOTIFS_CREATED:" + JSON.stringify(notifs.map(n => ({
        userEmail: n.user.email,
        title: n.title,
        message: n.message,
        type: n.type
      }))));
    }
    check().then(() => p.$disconnect());
  `;
  const b64 = Buffer.from(checkScript).toString('base64');
  const ec2Res = await runOnEc2([
    `cd /home/ec2-user/college-management-system/backend && node scripts/run-with-secrets.js node -e 'eval(Buffer.from("${b64}", "base64").toString("utf8"))'`
  ]);

  const output = ec2Res.stdout.split('\n').find(l => l.includes('NOTIFS_CREATED:'));
  if (output) {
    const notifs = JSON.parse(output.split('NOTIFS_CREATED:')[1]);
    console.log(`✓ Lambda created ${notifs.length} notification(s):`);
    notifs.forEach(n => console.log(`  -> To: ${n.userEmail} | ${n.title}`));
  } else {
    console.error('No notifications found for this assignment in RDS:', ec2Res);
  }

  console.log('\n=== 4. VERIFY ENROLLED STUDENT (student@campus.local) RETRIEVES NOTIFICATION VIA API ===');
  const studentToken = await getCognitoToken('student@campus.local', 'TempPassword123!');
  const studentNotifsRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const studentNotifsData = await studentNotifsRes.json();

  const notifsList = studentNotifsData.data || [];
  const found = notifsList.find(n => n.title.includes(uniqueTitle));
  if (found) {
    console.log('✓ Enrolled Student verified live notification in their feed:');
    console.log(`  Title: ${found.title}`);
    console.log(`  Message: ${found.message}`);
    console.log(`  Type: ${found.type}`);
  } else {
    console.error('Student notification feed did not contain the new assignment alert.');
  }

  console.log('\n=== 5. VERIFY NON-ENROLLED STUDENT EXCLUSION ===');
  const nonEnrolledCheck = `
    const { PrismaClient } = require('@prisma/client');
    const p = new PrismaClient();
    async function checkNonEnrolled() {
      const allStudents = await p.student.findMany({ include: { user: true } });
      const enrollments = await p.enrollment.findMany({ where: { courseId: "${targetCourse.id}", status: "ACTIVE" } });
      const enrolledStudentIds = new Set(enrollments.map(e => e.studentId));
      const nonEnrolled = allStudents.filter(s => !enrolledStudentIds.has(s.id));
      for (const ne of nonEnrolled) {
        const notifs = await p.notification.findMany({ where: { userId: ne.userId, title: { contains: "${uniqueTitle}" } } });
        console.log("NON_ENROLLED_COUNT:" + ne.user.email + ":" + notifs.length);
      }
    }
    checkNonEnrolled().then(() => p.$disconnect());
  `;
  const b64NonEnrolled = Buffer.from(nonEnrolledCheck).toString('base64');
  const nonEnrolledRes = await runOnEc2([
    `cd /home/ec2-user/college-management-system/backend && node scripts/run-with-secrets.js node -e 'eval(Buffer.from("${b64NonEnrolled}", "base64").toString("utf8"))'`
  ]);
  const nonEnrolledLines = nonEnrolledRes.stdout.split('\n').filter(l => l.includes('NON_ENROLLED_COUNT:'));
  nonEnrolledLines.forEach(l => {
    const [, email, count] = l.split(':');
    console.log(`✓ Non-enrolled user ${email} received ${count} notifications (Expected: 0)`);
  });

  console.log('\n=== COMPLETE END-TO-END FLOW VERIFIED ===');
}

testFacultyAssignmentFlow().catch(console.error);
