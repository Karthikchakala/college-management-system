import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';
import jwt from 'jsonwebtoken';

describe('Phase 2 — Student API Retrieval & Authorization Tests', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const karthikStudentToken = jwt.sign(
    {
      userId: 'karthik-user-id-001',
      email: 'karthikc11105@gmail.com',
      role: 'STUDENT',
      sub: '8458d4b8-a071-70f2-068d-daa6d1caa912',
    },
    secret,
    { expiresIn: '1h' }
  );

  const adminToken = jwt.sign(
    {
      userId: 'admin-user-id-001',
      email: 'admin@campus.edu',
      role: 'ADMIN',
    },
    secret,
    { expiresIn: '1h' }
  );

  const mockKarthikStudent = {
    id: 'karthik-stu-id-001',
    userId: 'karthik-user-id-001',
    firstName: 'Karthik',
    lastName: 'Chakala',
    enrollmentNumber: 'STU001',
    departmentId: 'dept-cse-id',
    department: {
      id: 'dept-cse-id',
      name: 'Computer Science & Engineering',
      code: 'CSE',
    },
  };

  const mockKarthikEnrollments = [
    {
      id: 'enr-1',
      studentId: 'karthik-stu-id-001',
      courseId: 'c-203',
      status: 'ACTIVE',
      course: {
        id: 'c-203',
        code: 'CSE203',
        name: 'Operating Systems',
        credits: 4,
        faculty: { id: 'fac-1', employeeId: 'FAC_CSE01', firstName: 'Deepak', lastName: 'Gannamaneni' },
      },
    },
    {
      id: 'enr-2',
      studentId: 'karthik-stu-id-001',
      courseId: 'c-204',
      status: 'ACTIVE',
      course: {
        id: 'c-204',
        code: 'CSE204',
        name: 'Computer Networks',
        credits: 4,
        faculty: { id: 'fac-3', employeeId: 'FAC_CSE03', firstName: 'Shaik', lastName: 'Venkat' },
      },
    },
    {
      id: 'enr-3',
      studentId: 'karthik-stu-id-001',
      courseId: 'c-207',
      status: 'ACTIVE',
      course: {
        id: 'c-207',
        code: 'CSE207',
        name: 'Software Engineering',
        credits: 3,
        faculty: { id: 'fac-2', employeeId: 'FAC_CSE02', firstName: 'Bhargav Reddy', lastName: 'Narra' },
      },
    },
    {
      id: 'enr-4',
      studentId: 'karthik-stu-id-001',
      courseId: 'c-208',
      status: 'ACTIVE',
      course: {
        id: 'c-208',
        code: 'CSE208',
        name: 'Cloud Computing',
        credits: 3,
        faculty: { id: 'fac-3', employeeId: 'FAC_CSE03', firstName: 'Shaik', lastName: 'Venkat' },
      },
    },
  ];

  // ----------------------------------------------------
  // 1. GET /api/student/dashboard
  // ----------------------------------------------------
  describe('GET /api/student/dashboard', () => {
    it('Scenario A: should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/student/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('Scenario C: should return 403 Forbidden with ADMIN token', async () => {
      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('Scenario B: should return 200 OK with full dashboard payload for Karthik', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);
      vi.spyOn(prisma.attendance, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.assignment, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.exam, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.event, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.announcement, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.notification, 'findMany').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/student/dashboard')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.firstName).toBe('Karthik');
      expect(res.body.data.profile.lastName).toBe('Chakala');
      expect(res.body.data.profile.enrollmentNumber).toBe('STU001');
      expect(res.body.data.profile.department.code).toBe('CSE');
      expect(res.body.data.coursesCount).toBe(4);
      expect(res.body.data.attendancePercentage).toBe(100);
      expect(Array.isArray(res.body.data.pendingAssignments)).toBe(true);
      expect(Array.isArray(res.body.data.upcomingExams)).toBe(true);
      expect(Array.isArray(res.body.data.upcomingEvents)).toBe(true);
      expect(Array.isArray(res.body.data.announcements)).toBe(true);
      expect(Array.isArray(res.body.data.notifications)).toBe(true);
    });
  });

  // ----------------------------------------------------
  // 2. GET /api/student/courses
  // ----------------------------------------------------
  describe('GET /api/student/courses', () => {
    it('Scenario A: should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/student/courses');
      expect(res.status).toBe(401);
    });

    it('Scenario C: should return 403 Forbidden with ADMIN token', async () => {
      const res = await request(app)
        .get('/api/student/courses')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario B: should return 200 OK with Karthiks enrolled CSE courses and instructors', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);

      const res = await request(app)
        .get('/api/student/courses')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(4);
      const courseCodes = res.body.data.map((c: any) => c.code);
      expect(courseCodes).toEqual(['CSE203', 'CSE204', 'CSE207', 'CSE208']);
      expect(res.body.data[0].faculty.firstName).toBe('Deepak');
      expect(res.body.data[1].faculty.firstName).toBe('Shaik');
    });
  });

  // ----------------------------------------------------
  // 3. GET /api/student/attendance
  // ----------------------------------------------------
  describe('GET /api/student/attendance', () => {
    it('Scenario A: should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/student/attendance');
      expect(res.status).toBe(401);
    });

    it('Scenario C: should return 403 Forbidden with ADMIN token', async () => {
      const res = await request(app)
        .get('/api/student/attendance')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario B: should return 200 OK with per-course attendance breakdown', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);
      vi.spyOn(prisma.attendance, 'findMany').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/student/attendance')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(4);
      expect(res.body.data[0].courseCode).toBe('CSE203');
      expect(res.body.data[0].percentage).toBe(100);
      expect(res.body.data[0].records).toEqual([]);
    });
  });

  // ----------------------------------------------------
  // 4. GET /api/student/assignments
  // ----------------------------------------------------
  describe('GET /api/student/assignments', () => {
    it('Scenario A: should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/student/assignments');
      expect(res.status).toBe(401);
    });

    it('Scenario C: should return 403 Forbidden with ADMIN token', async () => {
      const res = await request(app)
        .get('/api/student/assignments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario B: should return 200 OK with assignments for enrolled courses', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);
      vi.spyOn(prisma.assignment, 'findMany').mockResolvedValue([
        {
          id: 'assign-os-1',
          title: 'Assignment 1: Virtual Memory & Page Replacement',
          description: 'Simulate LRU and FIFO page replacement algorithms.',
          dueDate: new Date('2026-09-15T23:59:59.000Z'),
          points: 100,
          courseId: 'c-203',
          course: { code: 'CSE203', name: 'Operating Systems' },
          submissions: [],
        },
      ] as any);

      const res = await request(app)
        .get('/api/student/assignments')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].course.code).toBe('CSE203');
      expect(res.body.data[0].submissions).toEqual([]);
    });
  });

  // ----------------------------------------------------
  // 5. GET /api/student/exams
  // ----------------------------------------------------
  describe('GET /api/student/exams', () => {
    it('Scenario A: should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/student/exams');
      expect(res.status).toBe(401);
    });

    it('Scenario C: should return 403 Forbidden with ADMIN token', async () => {
      const res = await request(app)
        .get('/api/student/exams')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario B: should return 200 OK with scheduled exams for enrolled courses', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);
      vi.spyOn(prisma.exam, 'findMany').mockResolvedValue([
        {
          id: 'exam-cc-1',
          name: 'Midterm Examination: Cloud Architecture',
          examDate: new Date('2026-09-20T09:30:00.000Z'),
          startTime: '09:30 AM',
          endTime: '12:30 PM',
          location: 'Hall B - Room 204',
          maxMarks: 100,
          status: 'SCHEDULED',
          course: { code: 'CSE208', name: 'Cloud Computing' },
        },
      ] as any);

      const res = await request(app)
        .get('/api/student/exams')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].course.code).toBe('CSE208');
    });
  });

  // ----------------------------------------------------
  // 6. GET /api/student/results
  // ----------------------------------------------------
  describe('GET /api/student/results', () => {
    it('Scenario A: should return 401 Unauthorized without token', async () => {
      const res = await request(app).get('/api/student/results');
      expect(res.status).toBe(401);
    });

    it('Scenario C: should return 403 Forbidden with ADMIN token', async () => {
      const res = await request(app)
        .get('/api/student/results')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario B: should return 200 OK with published examination results', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.result, 'findMany').mockResolvedValue([
        {
          id: 'res-1',
          marksObtained: 94,
          grade: 'A+',
          status: 'PUBLISHED',
          remarks: 'Outstanding performance in Cloud Computing',
          exam: {
            name: 'Cloud Computing Midterm',
            maxMarks: 100,
            course: { code: 'CSE208', name: 'Cloud Computing' },
          },
        },
      ] as any);

      const res = await request(app)
        .get('/api/student/results')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].grade).toBe('A+');
      expect(res.body.data[0].exam.course.code).toBe('CSE208');
    });
  });
});
