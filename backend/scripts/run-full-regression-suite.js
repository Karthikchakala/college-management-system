const https = require('https');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://7k2yo6gy77.execute-api.us-east-1.amazonaws.com/prod/api';
const COGNITO_CLIENT_ID = '3kv2vgpkklqtlpfom2t72dn29n';
const COGNITO_REGION = 'us-east-1';

function httpsRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// 1. Authenticate with AWS Cognito using USER_PASSWORD_AUTH
async function loginCognito(email, password) {
  const url = new URL(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`);
  const payload = {
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  };

  const res = await httpsRequest({
    hostname: url.hostname,
    port: 443,
    path: '/',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
    }
  }, payload);

  if (res.statusCode === 200 && res.data.AuthenticationResult) {
    return {
      accessToken: res.data.AuthenticationResult.AccessToken,
      idToken: res.data.AuthenticationResult.IdToken
    };
  } else {
    throw new Error(`Cognito login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
}

async function apiCall(endpoint, method = 'GET', token = null, data = null) {
  const url = new URL(`${API_BASE}${endpoint}`);
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return await httpsRequest({
    hostname: url.hostname,
    port: 443,
    path: url.pathname + url.search,
    method,
    headers
  }, data);
}

async function runRegression() {
  console.log('===============================================================');
  console.log('    CLOUDCAMPUS — FULL AUTOMATED REGRESSION & API VERIFICATION  ');
  console.log('===============================================================');

  const results = [];

  function record(role, feature, pass, notes) {
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${role} -> ${feature}: ${notes}`);
    results.push({ role, feature, pass, notes });
  }

  try {
    // ----------------- 1. HEALTH CHECK -----------------
    const health = await apiCall('/health');
    record('System', 'API Gateway Health Check', health.statusCode === 200, `Status: ${health.data.status}`);

    // ----------------- 2. STUDENT AUTH & APIS -----------------
    console.log('\n--- Testing STUDENT Role: karthikc11105@gmail.com ---');
    const studentAuth = await loginCognito('karthikc11105@gmail.com', 'Password@123');
    record('Student', 'Cognito Authentication', !!studentAuth.idToken, 'Received valid OIDC JWT ID Token');

    const sProfile = await apiCall('/auth/profile', 'GET', studentAuth.idToken);
    record('Student', 'Get Profile', sProfile.statusCode === 200 && sProfile.data.data.email === 'karthikc11105@gmail.com', `Name: ${sProfile.data.data?.name}`);

    const sDash = await apiCall('/student/dashboard', 'GET', studentAuth.idToken);
    record('Student', 'Student Dashboard', sDash.statusCode === 200, `Metrics: Attendance ${sDash.data.data?.attendancePercentage || 'N/A'}%`);

    const sCourses = await apiCall('/student/courses', 'GET', studentAuth.idToken);
    record('Student', 'My Courses', sCourses.statusCode === 200 && Array.isArray(sCourses.data.data), `Enrolled in ${sCourses.data.data?.length || 0} courses`);

    const sAtt = await apiCall('/student/attendance', 'GET', studentAuth.idToken);
    record('Student', 'Attendance Tracker', sAtt.statusCode === 200, `Attendance logs retrieved successfully`);

    const sAssign = await apiCall('/student/assignments', 'GET', studentAuth.idToken);
    record('Student', 'Assignments List', sAssign.statusCode === 200 && Array.isArray(sAssign.data.data), `Found ${sAssign.data.data?.length || 0} assignments`);

    const sResults = await apiCall('/student/results', 'GET', studentAuth.idToken);
    record('Student', 'Exam Results', sResults.statusCode === 200, `Exam results retrieved successfully`);

    const sNotifs = await apiCall('/student/notifications', 'GET', studentAuth.idToken);
    record('Student', 'Notifications Feed', sNotifs.statusCode === 200, `Found ${sNotifs.data.data?.length || 0} notifications`);

    // ----------------- 3. FACULTY AUTH & APIS -----------------
    console.log('\n--- Testing FACULTY Role: deepakgannamaneni@gmail.com ---');
    const facultyAuth = await loginCognito('deepakgannamaneni@gmail.com', 'Password@123');
    record('Faculty', 'Cognito Authentication', !!facultyAuth.idToken, 'Received valid OIDC JWT ID Token');

    const fProfile = await apiCall('/auth/profile', 'GET', facultyAuth.idToken);
    record('Faculty', 'Get Profile', fProfile.statusCode === 200 && fProfile.data.data.email === 'deepakgannamaneni@gmail.com', `Faculty Name: ${fProfile.data.data?.name}`);

    const fDash = await apiCall('/faculty/dashboard', 'GET', facultyAuth.idToken);
    record('Faculty', 'Faculty Dashboard', fDash.statusCode === 200, `Active courses: ${fDash.data.data?.activeCourses || 0}`);

    const fCourses = await apiCall('/faculty/courses', 'GET', facultyAuth.idToken);
    record('Faculty', 'Faculty Assigned Courses', fCourses.statusCode === 200 && Array.isArray(fCourses.data.data), `Assigned to ${fCourses.data.data?.length || 0} courses`);

    // Faculty creates an assignment
    const targetCourse = fCourses.data.data && fCourses.data.data[0];
    let createdAssignmentId = null;
    if (targetCourse) {
      const newAssignRes = await apiCall('/faculty/assignments', 'POST', facultyAuth.idToken, {
        courseId: targetCourse.id,
        title: `Regression Test Assignment - ${Date.now()}`,
        description: 'Automated browser and cloud regression verification assignment.',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        maxMarks: 100
      });
      createdAssignmentId = newAssignRes.data.data?.id;
      record('Faculty', 'Create Assignment (Triggers Lambda & SNS)', newAssignRes.statusCode === 201 || newAssignRes.statusCode === 200, `Assignment ID: ${createdAssignmentId}`);
    }

    // ----------------- 4. ADMIN AUTH & APIS -----------------
    console.log('\n--- Testing ADMIN Role: admin@campus.local ---');
    const adminAuth = await loginCognito('admin@campus.local', 'Admin@123456');
    record('Admin', 'Cognito Authentication', !!adminAuth.idToken, 'Received valid OIDC JWT ID Token');

    const aDash = await apiCall('/admin/dashboard', 'GET', adminAuth.idToken);
    record('Admin', 'Admin Dashboard Metrics', aDash.statusCode === 200, `Students: ${aDash.data.data?.totalStudents}, Faculty: ${aDash.data.data?.totalFaculty}`);

    const aStudents = await apiCall('/admin/students', 'GET', adminAuth.idToken);
    record('Admin', 'Student Admissions Roster', aStudents.statusCode === 200 && Array.isArray(aStudents.data.data), `Total registered students: ${aStudents.data.data?.length}`);

    const aFaculty = await apiCall('/admin/faculty', 'GET', adminAuth.idToken);
    record('Admin', 'Faculty Management Roster', aFaculty.statusCode === 200 && Array.isArray(aFaculty.data.data), `Total faculty members: ${aFaculty.data.data?.length}`);

    const aDepts = await apiCall('/admin/departments', 'GET', adminAuth.idToken);
    record('Admin', 'Department Governance', aDepts.statusCode === 200 && Array.isArray(aDepts.data.data), `Departments count: ${aDepts.data.data?.length}`);

    const aAudit = await apiCall('/admin/audit-logs', 'GET', adminAuth.idToken);
    record('Admin', 'Audit Trail (RDS Immutable Logs)', aAudit.statusCode === 200 && Array.isArray(aAudit.data.data), `Recorded audit events count: ${aAudit.data.data?.length}`);

    // ----------------- 5. RBAC SECURITY CHECKS -----------------
    console.log('\n--- Testing Role-Based Access Control (RBAC) Security ---');
    // Student -> Faculty API (Should be 403)
    const sToF = await apiCall('/faculty/dashboard', 'GET', studentAuth.idToken);
    record('Security', 'Student accessing Faculty Route', sToF.statusCode === 403, `HTTP ${sToF.statusCode} (Expected 403 Forbidden)`);

    // Student -> Admin API (Should be 403)
    const sToA = await apiCall('/admin/dashboard', 'GET', studentAuth.idToken);
    record('Security', 'Student accessing Admin Route', sToA.statusCode === 403, `HTTP ${sToA.statusCode} (Expected 403 Forbidden)`);

    // Faculty -> Admin API (Should be 403)
    const fToA = await apiCall('/admin/dashboard', 'GET', facultyAuth.idToken);
    record('Security', 'Faculty accessing Admin Route', fToA.statusCode === 403, `HTTP ${fToA.statusCode} (Expected 403 Forbidden)`);

    // Unauthenticated -> Protected API (Should be 401)
    const unauth = await apiCall('/admin/dashboard', 'GET', null);
    record('Security', 'Unauthenticated request to Protected Route', unauth.statusCode === 401, `HTTP ${unauth.statusCode} (Expected 401 Unauthorized)`);

    // Admin -> Admin API (Should be 200)
    const aToA = await apiCall('/admin/dashboard', 'GET', adminAuth.idToken);
    record('Security', 'Admin accessing Admin Route', aToA.statusCode === 200, `HTTP ${aToA.statusCode} (Expected 200 OK)`);

    console.log('\n===============================================================');
    const passed = results.filter(r => r.pass).length;
    console.log(`TOTAL TESTS: ${results.length} | PASSED: ${passed} | FAILED: ${results.length - passed}`);
    console.log('===============================================================');

  } catch (err) {
    console.error('Fatal regression error:', err);
  }
}

runRegression();
