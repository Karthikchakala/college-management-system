import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 4 — Security Remediation: Faculty Announcement Course Ownership', () => {
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
  const cse208CourseId = crypto.randomUUID();
  const nonExistentCourseId = crypto.randomUUID();
  const announcementId = crypto.randomUUID();

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
    credits: 4,
    facultyId: deepakFacultyId, // Owned by Deepak
  };

  const actualCourseCSE208 = {
    id: cse208CourseId,
    code: 'CSE208',
    name: 'Cloud Computing',
    credits: 3,
    facultyId: shaikFacultyId, // Owned by Shaik
  };

  // State storage
  const announcementTable: any[] = [];

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
      if (id === cse208CourseId && facultyId === shaikFacultyId) return actualCourseCSE208 as any;
      return null; // Reject if not owned by faculty or course does not exist
    });

    // Mock Student Queries
    vi.spyOn(client.student, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === karthikUserId) return actualStudentKarthik as any;
      return null;
    });

    // Mock Announcement Creation
    vi.spyOn(client.announcement, 'create').mockImplementation(async (args: any) => {
      const newAnn = {
        id: announcementId,
        ...args.data,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      announcementTable.push(newAnn);
      return newAnn as any;
    });

    // Mock Announcement Queries for Dashboard
    vi.spyOn(client.announcement, 'findMany').mockImplementation(async (args: any) => {
      let filtered = [...announcementTable];
      if (args?.where?.status) filtered = filtered.filter(a => a.status === args.where.status);
      return filtered as any;
    });

    // Mock Enrollments
    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      { id: 'enr-cse203', studentId: karthikStudentId, courseId: cse203CourseId, status: 'ACTIVE', course: actualCourseCSE203 },
    ] as any);

    // Mock other dashboard models
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.exam, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.assignment, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.notification, 'findMany').mockResolvedValue([]);
  });

  // ----------------------------------------------------
  // Test 1: Unauthenticated -> 401
  // ----------------------------------------------------
  it('1. should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/faculty/announcements')
      .send({ title: 'Phase 4 Verification', content: 'Testing', courseId: cse203CourseId });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  // ----------------------------------------------------
  // Test 2: Student Token -> 403
  // ----------------------------------------------------
  it('2. should reject student token with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/faculty/announcements')
      .set('Authorization', `Bearer ${karthikStudentToken}`)
      .send({ title: 'Phase 4 Verification', content: 'Testing', courseId: cse203CourseId });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // ----------------------------------------------------
  // Test 3: Deepak token + CSE203 (Owned by Deepak) -> 201 Created
  // ----------------------------------------------------
  it('3. should successfully create course announcement for CSE203 by Deepak (owner)', async () => {
    const payload = {
      courseId: cse203CourseId,
      title: 'Phase 4 Verification — Operating Systems Announcement',
      content: 'Important announcement for Operating Systems students regarding upcoming academic activities and course requirements.',
    };

    const res = await request(app)
      .post('/api/faculty/announcements')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Announcement posted successfully');
    expect(res.body.data.id).toBe(announcementId);
    expect(res.body.data.title).toBe('Phase 4 Verification — Operating Systems Announcement');
    expect(res.body.data.courseId).toBe(cse203CourseId);
    expect(res.body.data.type).toBe('ACADEMIC');
    expect(res.body.data.status).toBe('ACTIVE');
  });

  // ----------------------------------------------------
  // Test 4: Shaik token + CSE203 (Owned by Deepak) -> 403 Forbidden
  // ----------------------------------------------------
  it('4. should reject with 403 Forbidden when Shaik (FAC_CSE03) attempts to post announcement for Deepak course (CSE203)', async () => {
    const payload = {
      courseId: cse203CourseId,
      title: 'Unauthorized Announcement',
      content: 'Should be rejected',
    };

    const res = await request(app)
      .post('/api/faculty/announcements')
      .set('Authorization', `Bearer ${shaikFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // ----------------------------------------------------
  // Test 5: Deepak token + CSE208 (Owned by Shaik) -> 403 Forbidden
  // ----------------------------------------------------
  it('5. should reject with 403 Forbidden when Deepak (FAC_CSE01) attempts to post announcement for Shaik course (CSE208)', async () => {
    const payload = {
      courseId: cse208CourseId,
      title: 'Unauthorized Announcement',
      content: 'Should be rejected',
    };

    const res = await request(app)
      .post('/api/faculty/announcements')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // ----------------------------------------------------
  // Test 6: Non-existent course UUID -> 403 Forbidden
  // ----------------------------------------------------
  it('6. should reject with 403 Forbidden when faculty attempts to post announcement for non-existent course ID', async () => {
    const payload = {
      courseId: nonExistentCourseId,
      title: 'Invalid Course Announcement',
      content: 'Should be rejected',
    };

    const res = await request(app)
      .post('/api/faculty/announcements')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  // ----------------------------------------------------
  // Test 7: Student Dashboard Verification
  // ----------------------------------------------------
  it('7. should surface the announcement on Karthiks dashboard', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const target = res.body.data.announcements.find((a: any) => a.title === 'Phase 4 Verification — Operating Systems Announcement');
    expect(target).toBeDefined();
  });
});
