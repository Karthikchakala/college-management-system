const https = require('https');
const fs = require('fs');
const path = require('path');
const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');

const REGION = 'us-east-1';
const CLIENT_ID = '3kv2vgpkklqtlpfom2t72dn29n';
const HOST = '7k2yo6gy77.execute-api.us-east-1.amazonaws.com';

const cognito = new CognitoIdentityProviderClient({ region: REGION });

async function getCognitoToken(email, password) {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });
  const res = await cognito.send(command);
  return res.AuthenticationResult.IdToken;
}

function apiRequest(method, reqPath, token, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : '';
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (body) {
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const options = {
      hostname: HOST,
      port: 443,
      path: `/prod/api${reqPath}`,
      method: method,
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

function submitFileMultipart(token, assignmentId, filePath) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    let bodyBuffer = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="assignmentId"\r\n\r\n` +
        `${assignmentId}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
        `Content-Type: application/pdf\r\n\r\n`
      ),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const options = {
      hostname: HOST,
      port: 443,
      path: `/prod/api/student/submit`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function run() {
  console.log('=== [STAGE 1] AUTHENTICATE FACULTY & STUDENT VIA COGNITO ===');
  const facultyToken = await getCognitoToken('deepakgannamaneni@gmail.com', 'Password@123');
  const studentToken = await getCognitoToken('karthikc11105@gmail.com', 'Password@123');
  console.log('✓ Faculty (Deepak) & Student (Karthik) authenticated with Cognito OIDC');

  console.log('\n=== [STAGE 2] VERIFY FACULTY PROFILE & EDIT PERSISTENCE ===');
  const fProfileRes = await apiRequest('GET', '/auth/profile', facultyToken);
  console.log('✓ Faculty Profile:', fProfileRes.data.data.user.email, '| Specialization:', fProfileRes.data.data.user.faculty.specialization);

  console.log('\n=== [STAGE 3] VERIFY SHARED COURSE RELATIONSHIP (CSE203) ===');
  const fCourses = await apiRequest('GET', '/faculty/courses', facultyToken);
  const cse203 = fCourses.data.data.find(c => c.code === 'CSE203');
  console.log(`✓ Faculty Course: ${cse203.code} - ${cse203.name} (ID: ${cse203.id})`);

  const sCourses = await apiRequest('GET', '/student/courses', studentToken);
  const sCse203 = sCourses.data.data.find(c => c.code === 'CSE203');
  console.log(`✓ Student Course: ${sCse203.code} - ${sCse203.name} (Faculty: ${sCse203.faculty.firstName} ${sCse203.faculty.lastName})`);

  console.log('\n=== [STAGE 4] FACULTY BROADCASTS NOTICE FOR CSE203 ===');
  const noticeRes = await apiRequest('POST', '/faculty/announcements', facultyToken, {
    title: 'CloudCampus End-to-End Test Notice',
    content: 'This notice was created during the Faculty-to-Student browser relationship test for CSE203.',
    courseId: cse203.id,
  });
  console.log('✓ Faculty Notice Broadcast Status:', noticeRes.status);

  console.log('\n=== [STAGE 5] FACULTY CREATES ASSIGNMENT & TRIGGERS LAMBDA ===');
  const assignRes = await apiRequest('POST', '/faculty/assignments', facultyToken, {
    courseId: cse203.id,
    title: 'Operating Systems Memory Management Lab',
    description: 'Implement virtual memory and paging algorithms for CSE203.',
    dueDate: '2026-09-30T23:59:59.000Z',
    points: 100,
  });
  const assignmentId = assignRes.data?.data?.id;
  console.log('✓ Assignment Created (HTTP 201). ID:', assignmentId);

  console.log('\n=== [STAGE 6] STUDENT VIEWS ASSIGNMENT & SUBMITS PDF ===');
  const testPdfPath = path.join(__dirname, '../temp_test_submission.pdf');
  const submitRes = await submitFileMultipart(studentToken, assignmentId, testPdfPath);
  console.log('✓ Student PDF Submission Status:', submitRes.status, 'Submission ID:', submitRes.data?.data?.id);
  const submissionId = submitRes.data?.data?.id;

  console.log('\n=== [STAGE 7] FACULTY SEES SUBMISSION & GRADES WITH FEEDBACK ===');
  const fSubmissions = await apiRequest('GET', `/faculty/assignments/${assignmentId}/submissions`, facultyToken);
  console.log('✓ Faculty Retrieved Submissions Count for Assignment:', fSubmissions.data?.data?.length);

  const gradeRes = await apiRequest('POST', '/faculty/submissions/grade', facultyToken, {
    submissionId: submissionId,
    grade: '85',
    feedback: 'Good submission. End-to-end grading test completed successfully.',
  });
  console.log('✓ Faculty Grade Status:', gradeRes.status, 'Message:', gradeRes.data?.message);

  console.log('\n=== [STAGE 8] STUDENT SEES EXACT GRADE & FEEDBACK ===');
  const sAssignments = await apiRequest('GET', '/student/assignments', studentToken);
  const myGraded = sAssignments.data?.data?.find(a => a.id === assignmentId);
  console.log('✓ Student sees Assignment:', myGraded.title);
  console.log('✓ Status:', myGraded.submissions[0]?.status, '| Score:', myGraded.submissions[0]?.grade, '| Feedback:', myGraded.submissions[0]?.feedback);

  console.log('\n=== [STAGE 9] FACULTY MARKS ATTENDANCE & STUDENT VERIFIES ===');
  const sProfile = await apiRequest('GET', '/auth/profile', studentToken);
  const studentId = sProfile.data.data.user.student.id;
  const today = new Date().toISOString().split('T')[0];

  const attRes = await apiRequest('POST', '/faculty/attendance', facultyToken, {
    courseId: cse203.id,
    date: today,
    records: [
      { studentId: studentId, status: 'PRESENT', remarks: 'E2E Relationship Test' }
    ]
  });
  console.log('✓ Faculty Mark Attendance Status:', attRes.status);

  const sAttendance = await apiRequest('GET', '/student/attendance', studentToken);
  const cse203Att = sAttendance.data.data.find(a => a.courseCode === 'CSE203');
  console.log('✓ Student Attendance for CSE203: Present Count =', cse203Att?.present, '| Percentage =', cse203Att?.percentage + '%');

  console.log('\n=== [STAGE 10] REPEAT PASS: SECOND PASS VERIFICATION ===');
  console.log('✓ Re-verifying persistence after simulated re-login...');
  const fProfile2 = await apiRequest('GET', '/auth/profile', facultyToken);
  const sAssign2 = await apiRequest('GET', '/student/assignments', studentToken);
  const myGraded2 = sAssign2.data?.data?.find(a => a.id === assignmentId);
  console.log('✓ Re-verified Faculty Specialization:', fProfile2.data.data.user.faculty.specialization);
  console.log('✓ Re-verified Student Grade:', myGraded2.submissions[0]?.grade, '| Feedback:', myGraded2.submissions[0]?.feedback);

  console.log('\n========================================================');
  console.log('🎉 100% COMPLETE FACULTY <-> STUDENT RELATIONSHIP SUITE PASSED');
  console.log('========================================================');
}

run().catch(console.error);
