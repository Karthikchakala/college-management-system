import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/db';
import jwt from 'jsonwebtoken';

describe('Phase 2B — Live Student Academic Data Retrieval Tests', () => {
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

  // 19 Attendance records (16 Present, 3 Absent = 84.21%)
  const mockAttendanceRecords = [
    // CSE203: 4 Present, 1 Absent
    { courseId: 'c-203', status: 'PRESENT', date: new Date('2026-08-18') },
    { courseId: 'c-203', status: 'PRESENT', date: new Date('2026-08-20') },
    { courseId: 'c-203', status: 'ABSENT', remarks: 'Medical leave', date: new Date('2026-08-22') },
    { courseId: 'c-203', status: 'PRESENT', date: new Date('2026-08-25') },
    { courseId: 'c-203', status: 'PRESENT', date: new Date('2026-08-27') },
    // CSE204: 5 Present, 0 Absent
    { courseId: 'c-204', status: 'PRESENT', date: new Date('2026-08-17') },
    { courseId: 'c-204', status: 'PRESENT', date: new Date('2026-08-19') },
    { courseId: 'c-204', status: 'PRESENT', date: new Date('2026-08-21') },
    { courseId: 'c-204', status: 'PRESENT', date: new Date('2026-08-24') },
    { courseId: 'c-204', status: 'PRESENT', date: new Date('2026-08-26') },
    // CSE207: 3 Present, 1 Absent
    { courseId: 'c-207', status: 'PRESENT', date: new Date('2026-08-18') },
    { courseId: 'c-207', status: 'PRESENT', date: new Date('2026-08-21') },
    { courseId: 'c-207', status: 'ABSENT', remarks: 'Personal reason', date: new Date('2026-08-25') },
    { courseId: 'c-207', status: 'PRESENT', date: new Date('2026-08-28') },
    // CSE208: 4 Present, 1 Absent
    { courseId: 'c-208', status: 'PRESENT', date: new Date('2026-08-17') },
    { courseId: 'c-208', status: 'PRESENT', date: new Date('2026-08-20') },
    { courseId: 'c-208', status: 'PRESENT', date: new Date('2026-08-24') },
    { courseId: 'c-208', status: 'ABSENT', remarks: 'AWS Collegiate Workshop', date: new Date('2026-08-27') },
    { courseId: 'c-208', status: 'PRESENT', date: new Date('2026-08-31') },
  ];

  // 3 Assignments (2 Pending, 1 Graded with S3 reference)
  const mockAssignments = [
    {
      id: 'assign-os-1',
      title: 'Assignment 1 — CPU Scheduling Algorithms',
      description: 'Implement FCFS, SJF, and Round Robin scheduling simulation.',
      dueDate: new Date('2026-09-15T23:59:59.000Z'),
      points: 100,
      courseId: 'c-203',
      course: { code: 'CSE203', name: 'Operating Systems' },
      submissions: [], // Pending
    },
    {
      id: 'assign-cc-1',
      title: 'Assignment 1 — Multi-Tier AWS Infrastructure',
      description: 'Design and deploy a resilient multi-tier web architecture.',
      dueDate: new Date('2026-08-28T23:59:59.000Z'),
      points: 100,
      courseId: 'c-208',
      course: { code: 'CSE208', name: 'Cloud Computing' },
      submissions: [
        {
          id: 'sub-cc-1',
          assignmentId: 'assign-cc-1',
          studentId: 'karthik-stu-id-001',
          submissionDate: new Date('2026-08-27T18:45:00.000Z'),
          fileUrl: 'https://cloudcampus-511225358997.s3.us-east-1.amazonaws.com/submissions/karthik_aws_infrastructure_report.pdf',
          fileName: 'karthik_aws_infrastructure_report.pdf',
          status: 'GRADED',
          grade: 'A+',
          feedback: 'Exceptional architecture diagrams, comprehensive security analysis, and clean Secrets Manager integration.',
          gradedAt: new Date('2026-08-29T14:30:00.000Z'),
        },
      ],
    },
    {
      id: 'assign-se-1',
      title: 'Assignment 1 — Agile Software Development',
      description: 'Create user stories, sprint backlogs, and burndown charts.',
      dueDate: new Date('2026-09-20T23:59:59.000Z'),
      points: 50,
      courseId: 'c-207',
      course: { code: 'CSE207', name: 'Software Engineering' },
      submissions: [], // Pending
    },
  ];

  // 1 Exam
  const mockExams = [
    {
      id: 'exam-cc-1',
      courseId: 'c-208',
      name: 'Midterm Examination',
      examDate: new Date('2026-08-25T09:30:00.000Z'),
      startTime: '09:30 AM',
      endTime: '12:30 PM',
      location: 'Main Block - Examination Hall B',
      maxMarks: 100,
      status: 'COMPLETED',
      course: { code: 'CSE208', name: 'Cloud Computing' },
    },
  ];

  // 1 Published Result
  const mockResults = [
    {
      id: 'res-cc-1',
      examId: 'exam-cc-1',
      studentId: 'karthik-stu-id-001',
      marksObtained: 92.5,
      grade: 'A',
      status: 'PUBLISHED',
      remarks: 'Outstanding performance in cloud architecture, security boundaries, and relational database migrations.',
      exam: {
        name: 'Midterm Examination',
        maxMarks: 100,
        course: { code: 'CSE208', name: 'Cloud Computing' },
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

    it('Scenario B: should return 200 OK with real calculated 84.21% attendance and 2 pending assignments', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);
      vi.spyOn(prisma.attendance, 'findMany').mockResolvedValue(mockAttendanceRecords as any);
      vi.spyOn(prisma.assignment, 'findMany').mockResolvedValue([mockAssignments[0], mockAssignments[2]] as any);
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
      expect(res.body.data.attendancePercentage).toBe(84.21); // 16 / 19 = 84.21%
      expect(res.body.data.pendingAssignments).toHaveLength(2);
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

    it('Scenario B: should return 200 OK with 4 enrolled courses and instructors', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);

      const res = await request(app)
        .get('/api/student/courses')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(4);
      const codes = res.body.data.map((c: any) => c.code);
      expect(codes).toEqual(['CSE203', 'CSE204', 'CSE207', 'CSE208']);
      expect(res.body.data.find((c: any) => c.code === 'CSE203').faculty.firstName).toBe('Deepak');
      expect(res.body.data.find((c: any) => c.code === 'CSE208').faculty.firstName).toBe('Shaik');
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

    it('Scenario B: should return 200 OK with accurate attendance percentages per course', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);

      vi.spyOn(prisma.attendance, 'findMany').mockImplementation(async (args: any) => {
        const courseId = args?.where?.courseId;
        return mockAttendanceRecords.filter(r => r.courseId === courseId) as any;
      });

      const res = await request(app)
        .get('/api/student/attendance')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(4);

      // Verify individual course percentages
      const c203 = res.body.data.find((a: any) => a.courseCode === 'CSE203');
      expect(c203.present).toBe(4);
      expect(c203.absent).toBe(1);
      expect(c203.total).toBe(5);
      expect(c203.percentage).toBe(80);

      const c204 = res.body.data.find((a: any) => a.courseCode === 'CSE204');
      expect(c204.present).toBe(5);
      expect(c204.absent).toBe(0);
      expect(c204.total).toBe(5);
      expect(c204.percentage).toBe(100);

      const c207 = res.body.data.find((a: any) => a.courseCode === 'CSE207');
      expect(c207.present).toBe(3);
      expect(c207.absent).toBe(1);
      expect(c207.total).toBe(4);
      expect(c207.percentage).toBe(75);

      const c208 = res.body.data.find((a: any) => a.courseCode === 'CSE208');
      expect(c208.present).toBe(4);
      expect(c208.absent).toBe(1);
      expect(c208.total).toBe(5);
      expect(c208.percentage).toBe(80);
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

    it('Scenario B: should return 200 OK with all 3 assignments including S3 submission for CSE208', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);
      vi.spyOn(prisma.assignment, 'findMany').mockResolvedValue(mockAssignments as any);

      const res = await request(app)
        .get('/api/student/assignments')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);

      const cse208Assign = res.body.data.find((a: any) => a.course.code === 'CSE208');
      expect(cse208Assign.submissions).toHaveLength(1);
      expect(cse208Assign.submissions[0].status).toBe('GRADED');
      expect(cse208Assign.submissions[0].grade).toBe('A+');
      expect(cse208Assign.submissions[0].fileUrl).toContain('cloudcampus-511225358997.s3.us-east-1.amazonaws.com');

      const cse203Assign = res.body.data.find((a: any) => a.course.code === 'CSE203');
      expect(cse203Assign.submissions).toHaveLength(0); // Pending
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

    it('Scenario B: should return 200 OK with Midterm Examination for CSE208', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.enrollment, 'findMany').mockResolvedValue(mockKarthikEnrollments as any);
      vi.spyOn(prisma.exam, 'findMany').mockResolvedValue(mockExams as any);

      const res = await request(app)
        .get('/api/student/exams')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Midterm Examination');
      expect(res.body.data[0].course.code).toBe('CSE208');
      expect(res.body.data[0].status).toBe('COMPLETED');
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

    it('Scenario B: should return 200 OK with published 92.5/100 Grade A result for CSE208', async () => {
      vi.spyOn(prisma.student, 'findUnique').mockResolvedValue(mockKarthikStudent as any);
      vi.spyOn(prisma.result, 'findMany').mockResolvedValue(mockResults as any);

      const res = await request(app)
        .get('/api/student/results')
        .set('Authorization', `Bearer ${karthikStudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].marksObtained).toBe(92.5);
      expect(res.body.data[0].grade).toBe('A');
      expect(res.body.data[0].status).toBe('PUBLISHED');
      expect(res.body.data[0].exam.course.code).toBe('CSE208');
    });
  });
});
