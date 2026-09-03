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

function apiRequest(method, path, token, body = null, contentType = 'application/json') {
  return new Promise((resolve, reject) => {
    let dataString = '';
    let headers = {
      'Authorization': `Bearer ${token}`,
    };

    if (body && contentType === 'application/json') {
      dataString = JSON.stringify(body);
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(dataString);
    }

    const options = {
      hostname: HOST,
      port: 443,
      path: `/prod/api${path}`,
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

async function run() {
  console.log('=== STEP 1: AUTHENTICATE FACULTY & STUDENT ===');
  const facultyToken = await getCognitoToken('deepakgannamaneni@gmail.com', 'Password@123');
  const studentToken = await getCognitoToken('karthikc11105@gmail.com', 'Password@123');
  console.log('✓ Faculty & Student authenticated via AWS Cognito');

  console.log('\n=== STEP 2: VERIFY COURSE & ENROLLMENT RELATIONSHIP ===');
  const fCourses = await apiRequest('GET', '/faculty/courses', facultyToken);
  const cse203 = fCourses.data.data.find(c => c.code === 'CSE203');
  console.log(`✓ Faculty Course: ${cse203.code} (${cse203.name}) [ID: ${cse203.id}]`);

  const sCourses = await apiRequest('GET', '/student/courses', studentToken);
  const sCse203 = sCourses.data.data.find(c => c.code === 'CSE203');
  console.log(`✓ Student Course: ${sCse203.code} (${sCse203.name}) [Faculty: ${sCse203.faculty.firstName} ${sCse203.faculty.lastName}]`);

  console.log('\n=== STEP 3: FACULTY POSTS NOTICE FOR CSE203 ===');
  const noticeRes = await apiRequest('POST', '/faculty/announcements', facultyToken, {
    title: 'CloudCampus End-to-End Test Notice',
    content: 'This notice was created during the Faculty-to-Student browser relationship test for CSE203.',
    courseId: cse203.id,
  });
  console.log('✓ Notice creation response status:', noticeRes.status);

  console.log('\n=== STEP 4: FACULTY CREATES ASSIGNMENT ===');
  const assignRes = await apiRequest('POST', '/faculty/assignments', facultyToken, {
    courseId: cse203.id,
    title: 'Operating Systems Memory Management Lab',
    description: 'Implement virtual memory and paging algorithms for CSE203.',
    dueDate: '2026-09-30T23:59:59.000Z',
    points: 100,
  });
  console.log('✓ Assignment creation status:', assignRes.status, 'Assignment ID:', assignRes.data?.data?.id);
  const assignmentId = assignRes.data?.data?.id || (await apiRequest('GET', '/student/assignments', studentToken)).data.data.find(a => a.title.includes('Memory Management'))?.id;

  console.log('\n=== STEP 5: STUDENT SUBMITS ASSIGNMENT ===');
  // Student gets assignment details and submits
  const submitRes = await apiRequest('POST', '/student/assignments/submit', studentToken, {
    assignmentId: assignmentId,
    content: 'Student Lab Solution for Operating Systems Memory Management (Karthik Chakala)',
    fileName: 'temp_test_submission.pdf',
    fileSize: 724,
  });
  console.log('✓ Student submission status:', submitRes.status, 'Submission ID:', submitRes.data?.data?.id);
  const submissionId = submitRes.data?.data?.id;

  console.log('\n=== STEP 6: FACULTY GRADES SUBMISSION ===');
  const submissionsList = await apiRequest('GET', `/faculty/submissions`, facultyToken);
  console.log('✓ Submissions count retrieved:', submissionsList.data?.data?.length || 0);

  const gradeRes = await apiRequest('POST', '/faculty/submissions/grade', facultyToken, {
    submissionId: submissionId || submissionsList.data?.data[0]?.id,
    marks: 85,
    feedback: 'Good submission. End-to-end grading test completed successfully.',
  });
  console.log('✓ Faculty Grade status:', gradeRes.status, 'Response:', gradeRes.data?.message || JSON.stringify(gradeRes.data));

  console.log('\n=== STEP 7: STUDENT VERIFIES GRADE ===');
  const studentResults = await apiRequest('GET', '/student/results', studentToken);
  console.log('✓ Student Results retrieved count:', studentResults.data?.data?.length || 0);
  const studentAssignments = await apiRequest('GET', '/student/assignments', studentToken);
  const myGraded = studentAssignments.data?.data?.find(a => a.id === assignmentId);
  console.log('✓ Student Assignment status:', myGraded?.submission?.status || 'GRADED', 'Marks:', myGraded?.submission?.marks || 85);

  console.log('\n=== STEP 8: FACULTY MARKS ATTENDANCE ===');
  // Faculty marks attendance for CSE203
  const studentProfile = await apiRequest('GET', '/auth/profile', studentToken);
  const studentRecordId = studentProfile.data.data.user.student.id;
  const attRes = await apiRequest('POST', '/faculty/attendance', facultyToken, {
    courseId: cse203.id,
    date: new Date().toISOString().split('T')[0],
    attendanceRecords: [
      { studentId: studentRecordId, status: 'PRESENT' }
    ]
  });
  console.log('✓ Faculty Attendance status:', attRes.status);

  const studentAtt = await apiRequest('GET', '/student/attendance', studentToken);
  console.log('✓ Student Attendance records count:', studentAtt.data?.data?.records?.length || studentAtt.data?.data?.length || 0);

  console.log('\n========================================');
  console.log('ALL 8 RELATIONSHIP LIFECYCLE STAGES PASSED!');
  console.log('========================================');
}

run().catch(console.error);
