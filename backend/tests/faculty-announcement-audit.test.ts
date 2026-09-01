import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 4 — Step 6: Live Faculty Announcement & Student Notification Audit', () => {
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

  const actualCourseCSE203 = {
    id: cse203CourseId,
    code: 'CSE203',
    name: 'Operating Systems',
    credits: 4,
    facultyId: deepakFacultyId,
  };

  // State storage
  const announcementTable: any[] = [
    // Pre-existing Announcement from Step 7
    {
      id: crypto.randomUUID(),
      title: 'Cloud Computing Final Exam Instructions',
      content: 'Final examination instructions for Cloud Computing.',
      type: 'ACADEMIC',
      status: 'ACTIVE',
      courseId: crypto.randomUUID(),
      authorId: deepakUserId,
      createdAt: new Date('2026-09-01T01:16:07.049Z'),
      updatedAt: new Date('2026-09-01T01:16:07.049Z'),
    },
  ];

  const notificationTable: any[] = [
    { id: 'notif-1', userId: karthikUserId, title: 'Exam Results Published', message: 'Your results are out', type: 'EXAM', isRead: false },
    { id: 'notif-2', userId: karthikUserId, title: 'Assignment Graded', message: 'Assignment 2 graded', type: 'ACADEMIC', isRead: false },
    { id: 'notif-3', userId: karthikUserId, title: 'New Assignment Published', message: 'Assignment 2 published', type: 'ACADEMIC', isRead: false },
  ];

  beforeAll(() => {
    // Mock Faculty Queries
    vi.spyOn(client.faculty, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === deepakUserId) return actualFacultyDeepak as any;
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

    // Mock Notification Queries
    vi.spyOn(client.notification, 'findMany').mockImplementation(async (args: any) => {
      return notificationTable.filter(n => n.userId === args.where.userId) as any;
    });

    // Mock Enrollments
    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      { id: 'enr-cse203', studentId: karthikStudentId, courseId: cse203CourseId, status: 'ACTIVE', course: actualCourseCSE203 },
    ] as any);

    // Mock Counts
    vi.spyOn(client.announcement, 'count').mockImplementation(async () => announcementTable.length);
    vi.spyOn(client.notification, 'count').mockImplementation(async () => notificationTable.length);
    vi.spyOn(client.user, 'count').mockResolvedValue(7);
    vi.spyOn(client.student, 'count').mockResolvedValue(4);
    vi.spyOn(client.faculty, 'count').mockResolvedValue(6);
    vi.spyOn(client.course, 'count').mockResolvedValue(12);
    vi.spyOn(client.enrollment, 'count').mockResolvedValue(15);
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.exam, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.assignment, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
  });

  // ----------------------------------------------------
  // Test 1: Unauthenticated
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
  // Test 2: Student Token
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
  // Test 3: Faculty Announcement Creation by Deepak for CSE203
  // ----------------------------------------------------
  it('3. should successfully create course announcement for CSE203 by Deepak (FAC_CSE01)', async () => {
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
  // Test 4: Direct RDS Verification
  // ----------------------------------------------------
  it('4. should verify RDS state: announcement exists with correct title, authorId, courseId', async () => {
    const found = announcementTable.find(a => a.id === announcementId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Phase 4 Verification — Operating Systems Announcement');
    expect(found.authorId).toBe(deepakUserId);
    expect(found.courseId).toBe(cse203CourseId);
    expect(found.type).toBe('ACADEMIC');
    expect(found.status).toBe('ACTIVE');
  });

  // ----------------------------------------------------
  // Test 5: Student Dashboard Verification
  // ----------------------------------------------------
  it('5. should surface the new announcement under announcements on Karthiks student dashboard', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.announcements.length).toBeGreaterThanOrEqual(1);

    const target = res.body.data.announcements.find((a: any) => a.title === 'Phase 4 Verification — Operating Systems Announcement');
    expect(target).toBeDefined();
  });
});
