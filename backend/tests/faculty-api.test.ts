import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';
import jwt from 'jsonwebtoken';

describe('Phase 3A — Faculty API Discovery & Live Retrieval Tests', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

  // Tokens for all roles
  const studentToken = jwt.sign({ userId: 'karthik-user-id-001', email: 'karthikc11105@gmail.com', role: 'STUDENT' }, secret, { expiresIn: '1h' });
  const adminToken = jwt.sign({ userId: 'admin-user-id-001', email: 'admin@campus.edu', role: 'ADMIN' }, secret, { expiresIn: '1h' });

  // Faculty tokens for the 4 seeded CSE professors
  const deepakFacultyToken = jwt.sign({ userId: 'deepak-user-id', email: 'deepakgannamaneni@gmail.com', role: 'FACULTY' }, secret, { expiresIn: '1h' });
  const bhargavFacultyToken = jwt.sign({ userId: 'bhargav-user-id', email: 'bhargavreddynarra2605@gmail.com', role: 'FACULTY' }, secret, { expiresIn: '1h' });
  const shaikFacultyToken = jwt.sign({ userId: 'shaik-user-id', email: 'shaikvenkat17@gmail.com', role: 'FACULTY' }, secret, { expiresIn: '1h' });
  const urFacultyToken = jwt.sign({ userId: 'ur-user-id', email: 'ur4207546@gmail.com', role: 'FACULTY' }, secret, { expiresIn: '1h' });

  // Mock faculty profiles
  const mockDeepakFaculty = {
    id: 'fac-deepak-id',
    userId: 'deepak-user-id',
    firstName: 'Deepak',
    lastName: 'Gannamaneni',
    employeeId: 'FAC_CSE01',
    designation: 'Professor',
    department: { code: 'CSE', name: 'Computer Science & Engineering' },
  };

  const mockShaikFaculty = {
    id: 'fac-shaik-id',
    userId: 'shaik-user-id',
    firstName: 'Shaik',
    lastName: 'Venkat',
    employeeId: 'FAC_CSE03',
    designation: 'Assistant Professor',
    department: { code: 'CSE', name: 'Computer Science & Engineering' },
  };

  const mockDeepakCourses = [
    { id: 'c-201', code: 'CSE201', name: 'Data Structures', credits: 4, facultyId: 'fac-deepak-id', status: 'ACTIVE', department: { code: 'CSE' } },
    { id: 'c-203', code: 'CSE203', name: 'Operating Systems', credits: 4, facultyId: 'fac-deepak-id', status: 'ACTIVE', department: { code: 'CSE' } },
  ];

  const mockShaikCourses = [
    { id: 'c-204', code: 'CSE204', name: 'Computer Networks', credits: 4, facultyId: 'fac-shaik-id', status: 'ACTIVE', department: { code: 'CSE' } },
    { id: 'c-208', code: 'CSE208', name: 'Cloud Computing', credits: 3, facultyId: 'fac-shaik-id', status: 'ACTIVE', department: { code: 'CSE' } },
  ];

  // ----------------------------------------------------
  // 1. GET /api/faculty/dashboard
  // ----------------------------------------------------
  describe('GET /api/faculty/dashboard', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/faculty/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('Scenario B: should return 403 when called with a STUDENT token', async () => {
      const res = await request(app)
        .get('/api/faculty/dashboard')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('Scenario C: should return 403 when called with an ADMIN token (Faculty-specific route)', async () => {
      const res = await request(app)
        .get('/api/faculty/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('Scenario D: should return 200 with Deepak Gannamanenis assigned courses and student metrics', async () => {
      vi.spyOn(prisma.faculty, 'findUnique').mockResolvedValue(mockDeepakFaculty as any);
      vi.spyOn(prisma.course, 'findMany').mockResolvedValue(mockDeepakCourses as any);
      vi.spyOn(prisma.enrollment, 'count').mockResolvedValue(3);
      vi.spyOn(prisma.assignmentSubmission, 'count').mockResolvedValue(0);
      vi.spyOn(prisma.exam, 'findMany').mockResolvedValue([]);
      vi.spyOn(prisma.announcement, 'findMany').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/faculty/dashboard')
        .set('Authorization', `Bearer ${deepakFacultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.profile.firstName).toBe('Deepak');
      expect(res.body.data.profile.employeeId).toBe('FAC_CSE01');
      expect(res.body.data.courses).toHaveLength(2);
      expect(res.body.data.studentsCount).toBe(3);
    });
  });

  // ----------------------------------------------------
  // 2. GET /api/faculty/courses
  // ----------------------------------------------------
  describe('GET /api/faculty/courses', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/faculty/courses');
      expect(res.status).toBe(401);
    });

    it('Scenario B: should return 403 for STUDENT token', async () => {
      const res = await request(app)
        .get('/api/faculty/courses')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario C: should return 200 with Shaik Venkats assigned courses (CSE204, CSE208)', async () => {
      vi.spyOn(prisma.faculty, 'findUnique').mockResolvedValue(mockShaikFaculty as any);
      vi.spyOn(prisma.course, 'findMany').mockResolvedValue(mockShaikCourses as any);

      const res = await request(app)
        .get('/api/faculty/courses')
        .set('Authorization', `Bearer ${shaikFacultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data.map((c: any) => c.code)).toEqual(['CSE204', 'CSE208']);
    });
  });

  // ----------------------------------------------------
  // 3. GET /api/faculty/courses/:courseId/students
  // ----------------------------------------------------
  describe('GET /api/faculty/courses/:courseId/students', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/faculty/courses/c-208/students');
      expect(res.status).toBe(401);
    });

    it('Scenario B: should return 403 for STUDENT token', async () => {
      const res = await request(app)
        .get('/api/faculty/courses/c-208/students')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario C: should return 200 with enrolled students for CSE208 (Cloud Computing)', async () => {
      const mockStudents = [
        {
          student: {
            id: 'stu-karthik',
            firstName: 'Karthik',
            lastName: 'Chakala',
            enrollmentNumber: 'STU001',
            user: { email: 'karthikc11105@gmail.com' },
          },
        },
      ];

      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockStudents as any);

      const res = await request(app)
        .get('/api/faculty/courses/c-208/students')
        .set('Authorization', `Bearer ${shaikFacultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].enrollmentNumber).toBe('STU001');
      expect(res.body.data[0].user.email).toBe('karthikc11105@gmail.com');
    });
  });

  // ----------------------------------------------------
  // 4. GET /api/faculty/attendance/:courseId
  // ----------------------------------------------------
  describe('GET /api/faculty/attendance/:courseId', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/faculty/attendance/c-203');
      expect(res.status).toBe(401);
    });

    it('Scenario B: should return 403 for STUDENT token', async () => {
      const res = await request(app)
        .get('/api/faculty/attendance/c-203')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario C: should return 200 with course attendance log for CSE203', async () => {
      const mockRecords = [
        { id: 'att-1', courseId: 'c-203', date: new Date('2026-08-27'), status: 'PRESENT', student: { firstName: 'Karthik', lastName: 'Chakala', enrollmentNumber: 'STU001' } },
        { id: 'att-2', courseId: 'c-203', date: new Date('2026-08-25'), status: 'PRESENT', student: { firstName: 'Karthik', lastName: 'Chakala', enrollmentNumber: 'STU001' } },
        { id: 'att-3', courseId: 'c-203', date: new Date('2026-08-22'), status: 'ABSENT', remarks: 'Medical leave', student: { firstName: 'Karthik', lastName: 'Chakala', enrollmentNumber: 'STU001' } },
      ];

      vi.spyOn(prisma.attendance, 'findMany').mockResolvedValue(mockRecords as any);

      const res = await request(app)
        .get('/api/faculty/attendance/c-203')
        .set('Authorization', `Bearer ${deepakFacultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data[2].status).toBe('ABSENT');
      expect(res.body.data[2].remarks).toBe('Medical leave');
    });
  });

  // ----------------------------------------------------
  // 5. GET /api/faculty/assignments/:assignmentId/submissions
  // ----------------------------------------------------
  describe('GET /api/faculty/assignments/:assignmentId/submissions', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/faculty/assignments/assign-cc-1/submissions');
      expect(res.status).toBe(401);
    });

    it('Scenario B: should return 403 for STUDENT token', async () => {
      const res = await request(app)
        .get('/api/faculty/assignments/assign-cc-1/submissions')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('Scenario C: should return 200 with Karthiks graded submission for CSE208 Assignment', async () => {
      const mockSubmissions = [
        {
          id: 'sub-cc-1',
          assignmentId: 'assign-cc-1',
          studentId: 'stu-karthik',
          submissionDate: new Date('2026-08-27T18:45:00.000Z'),
          fileUrl: 'https://cloudcampus-511225358997.s3.us-east-1.amazonaws.com/submissions/karthik_aws_infrastructure_report.pdf',
          fileName: 'karthik_aws_infrastructure_report.pdf',
          status: 'GRADED',
          grade: 'A+',
          feedback: 'Exceptional architecture diagrams, comprehensive security analysis, and clean Secrets Manager integration.',
          student: {
            id: 'stu-karthik',
            firstName: 'Karthik',
            lastName: 'Chakala',
            enrollmentNumber: 'STU001',
          },
        },
      ];

      vi.spyOn(prisma.assignmentSubmission, 'findMany').mockResolvedValue(mockSubmissions as any);

      const res = await request(app)
        .get('/api/faculty/assignments/assign-cc-1/submissions')
        .set('Authorization', `Bearer ${shaikFacultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].status).toBe('GRADED');
      expect(res.body.data[0].grade).toBe('A+');
      expect(res.body.data[0].student.enrollmentNumber).toBe('STU001');
      expect(res.body.data[0].fileUrl).toContain('cloudcampus-511225358997.s3.us-east-1.amazonaws.com');
    });
  });
});
