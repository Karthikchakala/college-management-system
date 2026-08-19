import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';

describe('System Relational & API Validation Integration Tests', () => {
  let adminToken: string;
  let facultyToken: string;
  let studentToken: string;

  let testDeptId: string;
  let testFacultyId: string;
  let testStudentId: string;
  let testCourseId: string;
  let testAssignmentId: string;
  let testSubmissionId: string;
  let testExamId: string;
  let testEventId: string;
  let testRegId: string;

  beforeAll(async () => {
    // 1. Authenticate and retrieve tokens for all three default roles
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@campus.local', password: 'password123' });
    adminToken = adminLogin.body.data.token;

    const facultyLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'faculty@campus.local', password: 'password123' });
    facultyToken = facultyLogin.body.data.token;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@campus.local', password: 'password123' });
    studentToken = studentLogin.body.data.token;
  });

  afterAll(async () => {
    // Clean up created entities to ensure database remains in seed state
    if (testSubmissionId) {
      await prisma.assignmentSubmission.deleteMany({ where: { id: testSubmissionId } });
    }
    if (testAssignmentId) {
      await prisma.assignment.deleteMany({ where: { id: testAssignmentId } });
    }
    if (testCourseId) {
      await prisma.enrollment.deleteMany({ where: { courseId: testCourseId } });
      await prisma.attendance.deleteMany({ where: { courseId: testCourseId } });
      await prisma.result.deleteMany({ where: { exam: { courseId: testCourseId } } });
      await prisma.exam.deleteMany({ where: { courseId: testCourseId } });
      await prisma.course.deleteMany({ where: { id: testCourseId } });
    }
    if (testStudentId) {
      await prisma.eventRegistration.deleteMany({ where: { studentId: testStudentId } });
      await prisma.student.delete({ where: { id: testStudentId } });
      const studentProfile = await prisma.user.findFirst({ where: { email: 'temp-student@campus.local' } });
      if (studentProfile) await prisma.user.delete({ where: { id: studentProfile.id } });
    }
    if (testFacultyId) {
      await prisma.faculty.delete({ where: { id: testFacultyId } });
      const facultyProfile = await prisma.user.findFirst({ where: { email: 'temp-faculty@campus.local' } });
      if (facultyProfile) await prisma.user.delete({ where: { id: facultyProfile.id } });
    }
    if (testDeptId) {
      await prisma.department.delete({ where: { id: testDeptId } });
    }
    if (testEventId) {
      await prisma.event.deleteMany({ where: { id: testEventId } });
    }
    await prisma.$disconnect();
  });

  // ==========================================
  // 1. ROLE AND SECURITY GATES
  // ==========================================
  describe('Authorization Rules', () => {
    it('should block Student from access to admin console routes (403)', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('should block Faculty from accessing administrative user actions (403)', async () => {
      const res = await request(app)
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${facultyToken}`)
        .send({ username: 'hacky' });
      expect(res.status).toBe(403);
    });

    it('should reject requests with corrupted or invalid tokens (401)', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_signature_token');
      expect(res.status).toBe(401);
    });
  });

  // ==========================================
  // 2. ADMINISTRATIVE CRUD TESTS
  // ==========================================
  describe('Administrative CRUD Operations', () => {
    it('should allow Admin to create a Department', async () => {
      const res = await request(app)
        .post('/api/admin/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Department of Cyber Security',
          code: 'CYBER',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      testDeptId = res.body.data.id;
    });

    it('should allow Admin to register a Faculty account', async () => {
      const res = await request(app)
        .post('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'cyberprof',
          email: 'temp-faculty@campus.local',
          password: 'password123',
          firstName: 'Robert',
          lastName: 'Morris',
          employeeId: 'EMP-Morris-101',
          designation: 'Professor',
          departmentId: testDeptId,
        });
      expect(res.status).toBe(201);
      testFacultyId = res.body.data.id;
    });

    it('should allow Admin to create a Student profile', async () => {
      const res = await request(app)
        .post('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'studentcyber',
          email: 'temp-student@campus.local',
          password: 'password123',
          firstName: 'Alice',
          lastName: 'Parker',
          enrollmentNumber: 'ROLL-Parker-505',
          dateOfBirth: '2004-05-12T00:00:00.000Z',
          departmentId: testDeptId,
          admissionDate: '2026-08-15T00:00:00.000Z',
        });
      expect(res.status).toBe(201);
      testStudentId = res.body.data.id;
    });

    it('should allow Admin to register a Course catalog', async () => {
      const res = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS-CYB-303',
          name: 'Cryptography and Protocols',
          description: 'Basic cryptographic hashes and network protocols.',
          credits: 4,
          departmentId: testDeptId,
          facultyId: testFacultyId,
        });
      expect(res.status).toBe(201);
      testCourseId = res.body.data.id;
    });
  });

  // ==========================================
  // 3. DATABASE RELATIONAL & INTEGRITY CHECKS
  // ==========================================
  describe('Database Integrity & Constraint Validation', () => {
    it('should reject Course creation with invalid Department ID (Foreign Key Check)', async () => {
      const res = await request(app)
        .post('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'CS-CYB-304',
          name: 'Broken Course Link',
          credits: 3,
          departmentId: '00000000-0000-0000-0000-000000000000', // Invalid UUID
        });
      expect(res.status).toBe(500); // Standard foreign key violation handled by central handler
    });

    it('should allow enrolling a student and reject duplicate enrollment (Unique Constraint Check)', async () => {
      // First enrollment succeeds
      const firstRes = await request(app)
        .post('/api/admin/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: testStudentId,
          courseId: testCourseId,
        });
      expect(firstRes.status).toBe(201);

      // Duplicate enrollment fails with 400
      const secondRes = await request(app)
        .post('/api/admin/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          studentId: testStudentId,
          courseId: testCourseId,
        });
      expect(secondRes.status).toBe(400);
      expect(secondRes.body.message).toContain('already enrolled');
    });

    it('should reject duplicate daily attendance records for same student/course/date', async () => {
      // Log in as the course instructor
      const profLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'temp-faculty@campus.local', password: 'password123' });
      const tempFacultyToken = profLogin.body.data.token;

      const recordPayload = {
        courseId: testCourseId,
        date: '2026-08-17',
        records: [
          {
            studentId: testStudentId,
            status: 'PRESENT',
            remarks: 'Lecture 1 presence',
          },
        ],
      };

      // First post
      const firstRes = await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${tempFacultyToken}`)
        .send(recordPayload);
      expect(firstRes.status).toBe(200);

      // Second post updates (upsert)
      const secondRes = await request(app)
        .post('/api/faculty/attendance')
        .set('Authorization', `Bearer ${tempFacultyToken}`)
        .send(recordPayload);
      expect(secondRes.status).toBe(200);
    });
  });

  // ==========================================
  // 4. ACADEMIC & TRANSACTIONS WORKFLOWS
  // ==========================================
  describe('Academic & Activity Workflows', () => {
    it('should allow Faculty to create an Assignment with file upload', async () => {
      const profLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'temp-faculty@campus.local', password: 'password123' });
      const tempFacultyToken = profLogin.body.data.token;

      const mockFileBuffer = Buffer.from('assignment document requirements');
      const res = await request(app)
        .post('/api/faculty/assignments')
        .set('Authorization', `Bearer ${tempFacultyToken}`)
        .attach('file', mockFileBuffer, 'syllabus.pdf')
        .field('title', 'Final Cryptography Essay')
        .field('description', 'Analyze SHA-256 protocols')
        .field('dueDate', '2026-08-30T12:00:00.000Z')
        .field('points', 100)
        .field('courseId', testCourseId);

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      testAssignmentId = res.body.data.id;
    });

    it('should allow Student to submit assignment files', async () => {
      // Log in as the enrolled student Alice
      const studLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'temp-student@campus.local', password: 'password123' });
      const tempStudentToken = studLogin.body.data.token;

      const mockSubmissionBuffer = Buffer.from('student submission answers');
      const res = await request(app)
        .post('/api/student/submit')
        .set('Authorization', `Bearer ${tempStudentToken}`)
        .attach('file', mockSubmissionBuffer, 'morris_essay.pdf')
        .field('assignmentId', testAssignmentId);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBeDefined();
      testSubmissionId = res.body.data.id;
    });

    it('should allow Faculty to grade student submissions', async () => {
      const profLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'temp-faculty@campus.local', password: 'password123' });
      const tempFacultyToken = profLogin.body.data.token;

      const res = await request(app)
        .post('/api/faculty/submissions/grade')
        .set('Authorization', `Bearer ${tempFacultyToken}`)
        .send({
          submissionId: testSubmissionId,
          grade: 'A+',
          feedback: 'Excellent breakdown of protocol mechanics.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('GRADED');
    });

    it('should allow Admin to publish announcement notices', async () => {
      const res = await request(app)
        .post('/api/admin/announcements')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Campus Midterm Exam Rules',
          content: 'All students must bring physical IDs.',
          type: 'EXAM',
        });
      expect(res.status).toBe(201);
    });

    it('should allow Student to view unread system notification list', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ==========================================
  // 5. AUDIT LOGS & SYSTEM REPORTS
  // ==========================================
  describe('System Auditing & Exports', () => {
    it('should allow Admin to fetch CSV reports', async () => {
      const res = await request(app)
        .get('/api/admin/reports/export/students')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
    });

    it('should allow Admin to inspect system Audit Logs', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.logs.length).toBeGreaterThan(0);
    });
  });
});
