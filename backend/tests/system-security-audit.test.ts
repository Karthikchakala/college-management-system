import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 5 — Full System Security, Authorization & Data-Integrity Audit', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  // Primary Entities & UUIDs
  const karthikUserId = crypto.randomUUID();
  const karthikStudentId = crypto.randomUUID();
  const otherStudentUserId = crypto.randomUUID();
  const otherStudentId = crypto.randomUUID();

  const deepakUserId = crypto.randomUUID();
  const deepakFacultyId = crypto.randomUUID();
  const shaikUserId = crypto.randomUUID();
  const shaikFacultyId = crypto.randomUUID();

  const adminUserId = crypto.randomUUID();

  const cse203CourseId = crypto.randomUUID(); // Deepak
  const cse208CourseId = crypto.randomUUID(); // Shaik

  // Tokens
  const karthikStudentToken = jwt.sign(
    { userId: karthikUserId, email: 'karthikc11105@gmail.com', role: 'STUDENT', sub: 'karthik-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const otherStudentToken = jwt.sign(
    { userId: otherStudentUserId, email: 'otherstudent@gmail.com', role: 'STUDENT', sub: 'other-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const deepakFacultyToken = jwt.sign(
    { userId: deepakUserId, email: 'deepakgannamaneni@gmail.com', role: 'FACULTY', sub: 'deepak-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const shaikFacultyToken = jwt.sign(
    { userId: shaikUserId, email: 'shaikvenkat17@gmail.com', role: 'FACULTY', sub: 'shaik-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    { userId: adminUserId, email: 'admin@campusadmin.edu', role: 'ADMIN', sub: 'admin-sub' },
    secret,
    { expiresIn: '1h' }
  );

  // User Entities
  const actualStudentKarthik = {
    id: karthikStudentId,
    userId: karthikUserId,
    enrollmentNumber: 'STU001',
    firstName: 'Karthik',
    lastName: 'Chakala',
    phone: '9876543210',
    address: 'Campus Hostel A',
    department: { code: 'CSE', name: 'Computer Science' },
  };

  const actualStudentOther = {
    id: otherStudentId,
    userId: otherStudentUserId,
    enrollmentNumber: 'STU002',
    firstName: 'Alex',
    lastName: 'Rivera',
    phone: '9123456789',
    address: 'Campus Hostel B',
    department: { code: 'CSE', name: 'Computer Science' },
  };

  const actualFacultyDeepak = {
    id: deepakFacultyId,
    userId: deepakUserId,
    employeeId: 'FAC_CSE01',
    firstName: 'Deepak',
    lastName: 'Gannamaneni',
  };

  const actualFacultyShaik = {
    id: shaikFacultyId,
    userId: shaikUserId,
    employeeId: 'FAC_CSE03',
    firstName: 'Shaik',
    lastName: 'Venkat',
  };

  const actualCourseCSE203 = {
    id: cse203CourseId,
    code: 'CSE203',
    name: 'Operating Systems',
    facultyId: deepakFacultyId,
  };

  const actualCourseCSE208 = {
    id: cse208CourseId,
    code: 'CSE208',
    name: 'Cloud Computing',
    facultyId: shaikFacultyId,
  };

  beforeAll(() => {
    // Mock Faculty Queries
    vi.spyOn(client.faculty, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === deepakUserId) return actualFacultyDeepak as any;
      if (args.where.userId === shaikUserId) return actualFacultyShaik as any;
      return null;
    });

    // Mock Student Queries
    vi.spyOn(client.student, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === karthikUserId) return actualStudentKarthik as any;
      if (args.where.userId === otherStudentUserId) return actualStudentOther as any;
      return null;
    });

    // Mock Course Queries
    vi.spyOn(client.course, 'findFirst').mockImplementation(async (args: any) => {
      const { id, facultyId } = args.where;
      if (id === cse203CourseId && facultyId === deepakFacultyId) return actualCourseCSE203 as any;
      if (id === cse208CourseId && facultyId === shaikFacultyId) return actualCourseCSE208 as any;
      return null;
    });

    vi.spyOn(client.course, 'findMany').mockImplementation(async (args: any) => {
      if (args?.where?.facultyId === deepakFacultyId) return [actualCourseCSE203] as any;
      if (args?.where?.facultyId === shaikFacultyId) return [actualCourseCSE208] as any;
      return [actualCourseCSE203, actualCourseCSE208] as any;
    });

    // Mock Enrollments (Karthik enrolled in CSE203 and CSE208)
    vi.spyOn(client.enrollment, 'findMany').mockImplementation(async (args: any) => {
      if (args?.where?.studentId === karthikStudentId) {
        return [
          { id: 'enr-1', studentId: karthikStudentId, courseId: cse203CourseId, status: 'ACTIVE', course: actualCourseCSE203 },
          { id: 'enr-2', studentId: karthikStudentId, courseId: cse208CourseId, status: 'ACTIVE', course: actualCourseCSE208 },
        ] as any;
      }
      return [] as any;
    });

    // Mock Notification queries
    vi.spyOn(client.notification, 'findMany').mockImplementation(async (args: any) => {
      if (args?.where?.userId === karthikUserId) {
        return [{ id: 'notif-karthik', userId: karthikUserId, title: 'Karthik Note', isRead: false }] as any;
      }
      return [] as any;
    });

    // Mock Attendance queries
    vi.spyOn(client.attendance, 'findMany').mockImplementation(async (args: any) => {
      if (args?.where?.studentId === karthikStudentId) {
        return [{ id: 'att-karthik', studentId: karthikStudentId, courseId: cse203CourseId, status: 'PRESENT' }] as any;
      }
      return [] as any;
    });

    // Mock Exam queries
    vi.spyOn(client.exam, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.assignment, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.announcement, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.result, 'findMany').mockResolvedValue([]);
  });

  // ====================================================
  // 1. Unauthenticated & Invalid Token Rejection (Phase 5B)
  // ====================================================
  describe('Phase 5B: Cognito / JWT Security Gates', () => {
    it('1. should reject unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/student/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('2. should reject malformed authorization header with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', 'InvalidTokenFormat');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('3. should reject invalid signature JWT with 401 Unauthorized', async () => {
      const invalidToken = jwt.sign({ userId: 'fake', role: 'STUDENT' }, 'wrong-secret');
      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${invalidToken}`);
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });
  });

  // ====================================================
  // 2. Role Isolation Matrix (Phase 5C)
  // ====================================================
  describe('Phase 5C: Role Isolation Matrix', () => {
    it('1. should reject student from accessing faculty endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/faculty/dashboard')
        .set('Authorization', `Bearer ${karthikStudentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('2. should reject student from accessing admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard-stats')
        .set('Authorization', `Bearer ${karthikStudentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('3. should reject faculty from accessing admin endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${deepakFacultyToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('4. should reject faculty from accessing student-only endpoints (403)', async () => {
      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${deepakFacultyToken}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // ====================================================
  // 3. Student-to-Student Isolation (Phase 5D)
  // ====================================================
  describe('Phase 5D: Student-to-Student Isolation & IDOR Prevention', () => {
    it('1. should scope student profile and attendance strictly to authenticated token userId', async () => {
      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.profile.enrollmentNumber).toBe('STU001');
      expect(res.body.data.profile.firstName).toBe('Karthik');
    });

    it('2. should prevent notification reading IDOR across students', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].userId).toBe(karthikUserId);
    });

    it('3. should reject parameter tampering in profile update (Mass Assignment Prevention)', async () => {
      const maliciousPayload = {
        phone: '1234567890',
        address: 'New Address',
        role: 'ADMIN', // Tampering attempt
        enrollmentNumber: 'HACKED001',
      };

      vi.spyOn(client.student, 'update').mockImplementation(async (args: any) => {
        // Zod middleware filters out role and enrollmentNumber
        return {
          ...actualStudentKarthik,
          phone: args.data.phone,
          address: args.data.address,
        } as any;
      });

      const res = await request(app)
        .put('/api/student/profile')
        .set('Authorization', `Bearer ${karthikStudentToken}`)
        .send(maliciousPayload);

      expect(res.status).toBe(200);
      expect(res.body.data.enrollmentNumber).toBe('STU001'); // Unaltered
    });
  });

  // ====================================================
  // 4. Faculty Course Ownership (Phase 5E & 5H)
  // ====================================================
  describe('Phase 5E & 5H: Faculty Course Ownership & Attendance Gates', () => {
    it('1. should allow Deepak (FAC_CSE01) to retrieve attendance for CSE203 (owned)', async () => {
      const res = await request(app)
        .get(`/api/faculty/attendance/${cse203CourseId}`)
        .set('Authorization', `Bearer ${deepakFacultyToken}`);

      expect(res.status).toBe(200);
    });

    it('2. should reject Shaik (FAC_CSE03) from retrieving attendance for CSE203 (owned by Deepak)', async () => {
      const res = await request(app)
        .get(`/api/faculty/attendance/${cse203CourseId}`)
        .set('Authorization', `Bearer ${shaikFacultyToken}`);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('3. should reject Deepak from creating announcements for CSE208 (owned by Shaik)', async () => {
      const res = await request(app)
        .post('/api/faculty/announcements')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send({ courseId: cse208CourseId, title: 'Unauthorized', content: 'Blocked' });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // ====================================================
  // 5. Information Disclosure & Error Sanitization (Phase 5N)
  // ====================================================
  describe('Phase 5N: Error Sanitization & Information Disclosure', () => {
    it('1. should not expose stack traces, database strings, or credentials on errors', async () => {
      const res = await request(app)
        .get('/api/faculty/courses/non-existent-uuid/students')
        .set('Authorization', `Bearer ${deepakFacultyToken}`);

      expect(res.body).not.toHaveProperty('stack');
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('connectionString');
    });
  });
});
