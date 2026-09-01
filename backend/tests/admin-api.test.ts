import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';
import jwt from 'jsonwebtoken';

describe('Admin API Retrieval & Authorization Tests', () => {
  // Generate sample tokens for role-based authorization testing
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const adminToken = jwt.sign({ userId: 'admin-test-id', email: 'admin@campus.edu', role: 'ADMIN' }, secret, { expiresIn: '1h' });
  const studentToken = jwt.sign({ userId: 'student-test-id', email: 'student@campus.edu', role: 'STUDENT' }, secret, { expiresIn: '1h' });

  // ----------------------------------------------------
  // 1. GET /api/admin/students
  // ----------------------------------------------------
  describe('GET /api/admin/students', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/admin/students');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('Scenario C: should return 403 when called with a STUDENT token', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('Scenario B: should return 200 with students and department/user relations when called with ADMIN token', async () => {
      const mockStudents = [
        {
          id: 'stu-1',
          userId: 'u-1',
          firstName: 'Manoj',
          lastName: 'Kumar',
          enrollmentNumber: 'CSE2026S001',
          departmentId: 'dept-cse',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'manoj23iiitk27@gmail.com', status: 'ACTIVE' },
        },
        {
          id: 'stu-2',
          userId: 'u-2',
          firstName: 'Praveen',
          lastName: 'Boggavarapu',
          enrollmentNumber: 'CSE2026S002',
          departmentId: 'dept-cse',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'boggavarapupraveen2036@gmail.com', status: 'ACTIVE' },
        },
        {
          id: 'stu-3',
          userId: 'u-3',
          firstName: 'Karthik',
          lastName: 'Chakala',
          enrollmentNumber: 'STU001',
          departmentId: 'dept-cse',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'karthikc11105@gmail.com', status: 'ACTIVE' },
        },
        {
          id: 'stu-4',
          userId: 'u-4',
          firstName: 'Emma',
          lastName: 'Davis',
          enrollmentNumber: 'STU002',
          departmentId: 'dept-cse',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'student@campus.local', status: 'ACTIVE' },
        },
      ];

      vi.spyOn(prisma.student, 'findMany').mockResolvedValue(mockStudents as any);
      vi.spyOn(prisma.student, 'count').mockResolvedValue(4);

      const res = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.students).toHaveLength(4);
      expect(res.body.data.total).toBe(4);
      expect(res.body.data.students[0].enrollmentNumber).toBe('CSE2026S001');
      expect(res.body.data.students[0].user.email).toBe('manoj23iiitk27@gmail.com');
      expect(res.body.data.students[0].department.code).toBe('CSE');
    });
  });

  // ----------------------------------------------------
  // 2. GET /api/admin/faculty
  // ----------------------------------------------------
  describe('GET /api/admin/faculty', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/admin/faculty');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('Scenario C: should return 403 when called with a STUDENT token', async () => {
      const res = await request(app)
        .get('/api/admin/faculty')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('Scenario B: should return 200 with faculty and department/user relations when called with ADMIN token', async () => {
      const mockFaculty = [
        {
          id: 'fac-1',
          firstName: 'Deepak',
          lastName: 'Gannamaneni',
          employeeId: 'FAC_CSE01',
          designation: 'Professor',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'deepakgannamaneni@gmail.com' },
        },
        {
          id: 'fac-2',
          firstName: 'Bhargav Reddy',
          lastName: 'Narra',
          employeeId: 'FAC_CSE02',
          designation: 'Associate Professor',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'bhargavreddynarra2605@gmail.com' },
        },
        {
          id: 'fac-3',
          firstName: 'Shaik',
          lastName: 'Venkat',
          employeeId: 'FAC_CSE03',
          designation: 'Assistant Professor',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'shaikvenkat17@gmail.com' },
        },
        {
          id: 'fac-4',
          firstName: 'UR',
          lastName: 'Faculty',
          employeeId: 'FAC_CSE04',
          designation: 'Assistant Professor',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'ur4207546@gmail.com' },
        },
        {
          id: 'fac-5',
          firstName: 'John',
          lastName: 'Doe',
          employeeId: 'FAC001',
          designation: 'Professor',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'faculty@campus.edu' },
        },
        {
          id: 'fac-6',
          firstName: 'Alice',
          lastName: 'Smith',
          employeeId: 'FAC002',
          designation: 'Associate Professor',
          department: { name: 'Computer Science & Engineering', code: 'CSE' },
          user: { email: 'faculty@campus.local' },
        },
      ];

      vi.spyOn(prisma.faculty, 'findMany').mockResolvedValue(mockFaculty as any);
      vi.spyOn(prisma.faculty, 'count').mockResolvedValue(6);

      const res = await request(app)
        .get('/api/admin/faculty')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.faculty).toHaveLength(6);
      expect(res.body.data.faculty[0].employeeId).toBe('FAC_CSE01');
      expect(res.body.data.faculty[0].user.email).toBe('deepakgannamaneni@gmail.com');
    });
  });

  // ----------------------------------------------------
  // 3. GET /api/admin/departments
  // ----------------------------------------------------
  describe('GET /api/admin/departments', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/admin/departments');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('Scenario C: should return 403 when called with a STUDENT token', async () => {
      const res = await request(app)
        .get('/api/admin/departments')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('Scenario B: should return 200 with all departments when called with ADMIN token', async () => {
      const mockDepts = [
        { id: 'dept-1', name: 'Computer Science & Engineering', code: 'CSE', status: 'ACTIVE' },
        { id: 'dept-2', name: 'Electronics & Communication Engineering', code: 'ECE', status: 'ACTIVE' },
        { id: 'dept-3', name: 'Mechanical Engineering', code: 'ME', status: 'ACTIVE' },
      ];

      vi.spyOn(prisma.department, 'findMany').mockResolvedValue(mockDepts as any);

      const res = await request(app)
        .get('/api/admin/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.data.map((d: any) => d.code)).toEqual(['CSE', 'ECE', 'ME']);
    });
  });

  // ----------------------------------------------------
  // 4. GET /api/admin/courses
  // ----------------------------------------------------
  describe('GET /api/admin/courses', () => {
    it('Scenario A: should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/admin/courses');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('Scenario C: should return 403 when called with a STUDENT token', async () => {
      const res = await request(app)
        .get('/api/admin/courses')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('Scenario B: should return 200 with all 12 courses including department and faculty details when called with ADMIN token', async () => {
      const mockCourses = [
        { code: 'CS101', name: 'Introduction to Programming', credits: 3, department: { code: 'CSE' }, faculty: { employeeId: 'FAC001', firstName: 'John', lastName: 'Doe' } },
        { code: 'CS301', name: 'Database Management Systems', credits: 4, department: { code: 'CSE' }, faculty: { employeeId: 'FAC001', firstName: 'John', lastName: 'Doe' } },
        { code: 'CSE201', name: 'Data Structures', credits: 4, department: { code: 'CSE' }, faculty: { employeeId: 'FAC_CSE01', firstName: 'Deepak', lastName: 'Gannamaneni' } },
        { code: 'CSE202', name: 'Database Management Systems', credits: 4, department: { code: 'CSE' }, faculty: { employeeId: 'FAC_CSE02', firstName: 'Bhargav Reddy', lastName: 'Narra' } },
        { code: 'CSE203', name: 'Operating Systems', credits: 4, department: { code: 'CSE' }, faculty: { employeeId: 'FAC_CSE01', firstName: 'Deepak', lastName: 'Gannamaneni' } },
        { code: 'CSE204', name: 'Computer Networks', credits: 4, department: { code: 'CSE' }, faculty: { employeeId: 'FAC_CSE03', firstName: 'Shaik', lastName: 'Venkat' } },
        { code: 'CSE205', name: 'Machine Learning', credits: 3, department: { code: 'CSE' }, faculty: { employeeId: 'FAC_CSE04', firstName: 'UR', lastName: 'Faculty' } },
        { code: 'CSE206', name: 'Web Technologies', credits: 3, department: { code: 'CSE' }, faculty: { employeeId: 'FAC_CSE04', firstName: 'UR', lastName: 'Faculty' } },
        { code: 'CSE207', name: 'Software Engineering', credits: 3, department: { code: 'CSE' }, faculty: { employeeId: 'FAC_CSE02', firstName: 'Bhargav Reddy', lastName: 'Narra' } },
        { code: 'CSE208', name: 'Cloud Computing', credits: 3, department: { code: 'CSE' }, faculty: { employeeId: 'FAC_CSE03', firstName: 'Shaik', lastName: 'Venkat' } },
        { code: 'EC201', name: 'Digital Electronics', credits: 3, department: { code: 'ECE' }, faculty: { employeeId: 'FAC002', firstName: 'Alice', lastName: 'Smith' } },
        { code: 'ME101', name: 'Engineering Drawing', credits: 2, department: { code: 'ME' }, faculty: null },
      ];

      vi.spyOn(prisma.course, 'findMany').mockResolvedValue(mockCourses as any);

      const res = await request(app)
        .get('/api/admin/courses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(12);
      expect(res.body.data.find((c: any) => c.code === 'CSE201').faculty.employeeId).toBe('FAC_CSE01');
      expect(res.body.data.find((c: any) => c.code === 'CSE208').faculty.employeeId).toBe('FAC_CSE03');
    });
  });
});
