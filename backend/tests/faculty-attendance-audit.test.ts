import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 4 — Step 4: Live Faculty Attendance Retrieval & Authorization Audit', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  // Valid UUIDs
  const karthikUserId = crypto.randomUUID();
  const karthikStudentId = crypto.randomUUID();
  const deepakUserId = crypto.randomUUID();
  const deepakFacultyId = crypto.randomUUID();
  const shaikUserId = crypto.randomUUID();
  const shaikFacultyId = crypto.randomUUID();
  const cse203CourseId = crypto.randomUUID();
  const cse204CourseId = crypto.randomUUID();
  const nonExistentCourseId = crypto.randomUUID();

  // Tokens
  const deepakFacultyToken = jwt.sign(
    { userId: deepakUserId, email: 'deepakgannamaneni@gmail.com', role: 'FACULTY', sub: 'deepak-cognito-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const shaikFacultyToken = jwt.sign(
    { userId: shaikUserId, email: 'shaikvenkat17@gmail.com', role: 'FACULTY', sub: 'shaik-cognito-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const karthikStudentToken = jwt.sign(
    { userId: karthikUserId, email: 'karthikc11105@gmail.com', role: 'STUDENT', sub: '8458d4b8-a071-70f2-068d-daa6d1caa912' },
    secret,
    { expiresIn: '1h' }
  );

  // Entities
  const actualStudentKarthik = {
    id: karthikStudentId,
    userId: karthikUserId,
    enrollmentNumber: 'STU001',
    firstName: 'Karthik',
    lastName: 'Chakala',
    department: { code: 'CSE', name: 'Computer Science & Engineering' },
  };

  const actualFacultyDeepak = {
    id: deepakFacultyId,
    userId: deepakUserId,
    employeeId: 'FAC_CSE01',
    firstName: 'Deepak',
    lastName: 'Gannamaneni',
    designation: 'Professor',
  };

  const actualFacultyShaik = {
    id: shaikFacultyId,
    userId: shaikUserId,
    employeeId: 'FAC_CSE03',
    firstName: 'Shaik',
    lastName: 'Venkat',
    designation: 'Assistant Professor',
  };

  const actualCourseCSE203 = {
    id: cse203CourseId,
    code: 'CSE203',
    name: 'Operating Systems',
    credits: 4,
    facultyId: deepakFacultyId, // Owned by Deepak
  };

  const actualCourseCSE204 = {
    id: cse204CourseId,
    code: 'CSE204',
    name: 'Computer Networks',
    credits: 4,
    facultyId: shaikFacultyId, // Owned by Shaik
  };

  // 6 Attendance Records for CSE203 (5 PRESENT, 1 ABSENT = 83.33%)
  const attendanceRecordsCSE203 = [
    { id: 'att-6', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-09-02T00:00:00.000Z'), status: 'PRESENT', remarks: 'Phase 3C live API verification', student: actualStudentKarthik },
    { id: 'att-5', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-27T00:00:00.000Z'), status: 'PRESENT', remarks: null, student: actualStudentKarthik },
    { id: 'att-4', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-25T00:00:00.000Z'), status: 'PRESENT', remarks: null, student: actualStudentKarthik },
    { id: 'att-3', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-22T00:00:00.000Z'), status: 'ABSENT', remarks: 'Medical leave', student: actualStudentKarthik },
    { id: 'att-2', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-20T00:00:00.000Z'), status: 'PRESENT', remarks: null, student: actualStudentKarthik },
    { id: 'att-1', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-18T00:00:00.000Z'), status: 'PRESENT', remarks: null, student: actualStudentKarthik },
  ];

  beforeAll(() => {
    // Mock Faculty Queries
    vi.spyOn(client.faculty, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === deepakUserId) return actualFacultyDeepak as any;
      if (args.where.userId === shaikUserId) return actualFacultyShaik as any;
      return null;
    });

    // Mock Course Ownership Queries
    vi.spyOn(client.course, 'findFirst').mockImplementation(async (args: any) => {
      const { id, facultyId } = args.where;
      if (id === cse203CourseId && facultyId === deepakFacultyId) return actualCourseCSE203 as any;
      if (id === cse204CourseId && facultyId === shaikFacultyId) return actualCourseCSE204 as any;
      return null; // Reject if faculty does not own course or course does not exist
    });

    // Mock Student Queries
    vi.spyOn(client.student, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === karthikUserId) return actualStudentKarthik as any;
      return null;
    });

    // Mock Attendance Queries
    vi.spyOn(client.attendance, 'findMany').mockImplementation(async (args: any) => {
      if (args?.where?.courseId === cse203CourseId) {
        return attendanceRecordsCSE203 as any;
      }
      return [] as any;
    });

    vi.spyOn(client.attendance, 'count').mockResolvedValue(20);
  });

  // ----------------------------------------------------
  // Test 1: Unauthenticated
  // ----------------------------------------------------
  it('1. should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app)
      .get(`/api/faculty/attendance/${cse203CourseId}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  // ----------------------------------------------------
  // Test 2: Student Token
  // ----------------------------------------------------
  it('2. should reject student token with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/faculty/attendance/${cse203CourseId}`)
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // ----------------------------------------------------
  // Test 3: Correct Faculty (Deepak) Retrieves Attendance for CSE203
  // ----------------------------------------------------
  it('3. should return 200 OK with all 6 attendance records for CSE203 when Deepak calls GET /api/faculty/attendance/:courseId', async () => {
    const res = await request(app)
      .get(`/api/faculty/attendance/${cse203CourseId}`)
      .set('Authorization', `Bearer ${deepakFacultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(6);

    const presents = res.body.data.filter((r: any) => r.status === 'PRESENT');
    const absents = res.body.data.filter((r: any) => r.status === 'ABSENT');

    expect(presents).toHaveLength(5);
    expect(absents).toHaveLength(1);

    const phase3cRecord = res.body.data.find((r: any) => r.remarks === 'Phase 3C live API verification');
    expect(phase3cRecord).toBeDefined();
    expect(phase3cRecord.status).toBe('PRESENT');
    expect(new Date(phase3cRecord.date).toISOString().slice(0, 10)).toBe('2026-09-02');
  });

  // ----------------------------------------------------
  // Test 4: Cross-Faculty Ownership Test (Shaik attempts to view Deepak's CSE203)
  // ----------------------------------------------------
  it('4. should reject with 403 Forbidden when Shaik (FAC_CSE03) attempts to retrieve attendance for CSE203 (owned by Deepak)', async () => {
    const res = await request(app)
      .get(`/api/faculty/attendance/${cse203CourseId}`)
      .set('Authorization', `Bearer ${shaikFacultyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // ----------------------------------------------------
  // Test 5: Deepak attempts to view CSE204 (owned by Shaik)
  // ----------------------------------------------------
  it('5. should reject with 403 Forbidden when Deepak (FAC_CSE01) attempts to retrieve attendance for CSE204 (owned by Shaik)', async () => {
    const res = await request(app)
      .get(`/api/faculty/attendance/${cse204CourseId}`)
      .set('Authorization', `Bearer ${deepakFacultyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // ----------------------------------------------------
  // Test 6: Non-existent / Invalid Course ID
  // ----------------------------------------------------
  it('6. should reject with 403 Forbidden when faculty attempts to query a non-existent course ID', async () => {
    const res = await request(app)
      .get(`/api/faculty/attendance/${nonExistentCourseId}`)
      .set('Authorization', `Bearer ${deepakFacultyToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
