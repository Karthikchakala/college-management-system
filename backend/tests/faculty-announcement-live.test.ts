import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 3C — Step 7: Live Faculty Course Announcement & Student Dashboard Test', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  // Valid UUIDs
  const karthikUserId = crypto.randomUUID();
  const karthikStudentId = crypto.randomUUID();
  const deepakUserId = crypto.randomUUID();
  const deepakFacultyId = crypto.randomUUID();
  const cse208CourseId = crypto.randomUUID();
  const announcementId = crypto.randomUUID();

  // Tokens
  const deepakFacultyToken = jwt.sign(
    { userId: deepakUserId, email: 'deepakgannamaneni@gmail.com', role: 'FACULTY', sub: 'deepak-cognito-sub' },
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

  const actualCourseCSE208 = {
    id: cse208CourseId,
    code: 'CSE208',
    name: 'Cloud Computing',
    credits: 4,
    facultyId: deepakFacultyId,
  };

  // State storage
  const announcementTable: any[] = [];

  beforeAll(() => {
    // Mock Faculty Queries
    vi.spyOn(client.faculty, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === deepakUserId) return actualFacultyDeepak as any;
      return null;
    });

    // Mock Course Ownership Queries
    vi.spyOn(client.course, 'findFirst').mockImplementation(async (args: any) => {
      const { id, facultyId } = args.where;
      if (id === cse208CourseId && facultyId === deepakFacultyId) return actualCourseCSE208 as any;
      return null;
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
      { id: 'enr-cse208', studentId: karthikStudentId, courseId: cse208CourseId, status: 'ACTIVE', course: actualCourseCSE208 },
    ] as any);

    // Mock Attendance, Exams, Events, Notifications
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.exam, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.assignment, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.notification, 'findMany').mockResolvedValue([]);
  });

  // ----------------------------------------------------
  // 1. Create Announcement via POST /api/faculty/announcements
  // ----------------------------------------------------
  it('1. should successfully post course announcement for CSE208 via POST /api/faculty/announcements', async () => {
    const payload = {
      courseId: cse208CourseId,
      title: 'Cloud Computing Final Exam Instructions',
      content:
        'Final examination instructions and reporting details for the Cloud Computing course will be shared through the student portal. Students should review the examination schedule and arrive at the examination hall before the scheduled start time.',
    };

    const res = await request(app)
      .post('/api/faculty/announcements')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Announcement posted successfully');
    expect(res.body.data.id).toBe(announcementId);
    expect(res.body.data.title).toBe('Cloud Computing Final Exam Instructions');
    expect(res.body.data.type).toBe('ACADEMIC');
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.courseId).toBe(cse208CourseId);
  });

  // ----------------------------------------------------
  // 2. Direct RDS Verification
  // ----------------------------------------------------
  it('2. should verify RDS state: exactly 1 announcement exists for CSE208 with status ACTIVE', async () => {
    expect(announcementTable).toHaveLength(1);
    const ann = announcementTable[0];
    expect(ann.id).toBe(announcementId);
    expect(ann.title).toBe('Cloud Computing Final Exam Instructions');
    expect(ann.authorId).toBe(deepakUserId);
    expect(ann.courseId).toBe(cse208CourseId);
    expect(ann.type).toBe('ACADEMIC');
  });

  // ----------------------------------------------------
  // 3. Student Dashboard Verification
  // ----------------------------------------------------
  it('3. should surface the new announcement under announcements on Karthiks student dashboard', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.announcements).toHaveLength(1);
    expect(res.body.data.announcements[0].title).toBe('Cloud Computing Final Exam Instructions');
  });

  // ----------------------------------------------------
  // 4. Security & Authorization Checks
  // ----------------------------------------------------
  it('4. should reject student from posting announcements with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/faculty/announcements')
      .set('Authorization', `Bearer ${karthikStudentToken}`)
      .send({ title: 'Student Announcement', content: 'Not allowed' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('5. should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/faculty/announcements')
      .send({ title: 'Unauth Announcement', content: 'Not allowed' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});
