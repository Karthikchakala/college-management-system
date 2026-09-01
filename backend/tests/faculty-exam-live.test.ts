import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 3C — Step 5: Live Faculty Exam Creation & Student Retrieval Test', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  // Valid UUIDs
  const karthikUserId = crypto.randomUUID();
  const karthikStudentId = crypto.randomUUID();
  const deepakUserId = crypto.randomUUID();
  const deepakFacultyId = crypto.randomUUID();
  const shaikUserId = crypto.randomUUID();
  const shaikFacultyId = crypto.randomUUID();
  const cse208CourseId = crypto.randomUUID();
  const midtermExamId = crypto.randomUUID();
  const finalExamId = crypto.randomUUID();

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

  const actualCourseCSE208 = {
    id: cse208CourseId,
    code: 'CSE208',
    name: 'Cloud Computing',
    credits: 4,
    facultyId: deepakFacultyId,
  };

  // State storage
  const examTable: any[] = [
    // Pre-existing Midterm Exam
    {
      id: midtermExamId,
      name: 'Midterm Examination',
      examDate: new Date('2026-08-25T09:30:00.000Z'),
      startTime: '09:30 AM',
      endTime: '11:30 AM',
      location: 'LH-101',
      maxMarks: 100,
      courseId: cse208CourseId,
      status: 'COMPLETED',
      course: actualCourseCSE208,
      results: [],
    },
  ];

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
      return null;
    });

    // Mock Enrollments
    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      { id: 'enr-cse208', studentId: karthikStudentId, courseId: cse208CourseId, status: 'ACTIVE', course: actualCourseCSE208 },
    ] as any);

    // Mock Exam Creation
    vi.spyOn(client.exam, 'create').mockImplementation(async (args: any) => {
      const newExam = {
        id: finalExamId,
        ...args.data,
        status: 'SCHEDULED',
        course: actualCourseCSE208,
        results: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      examTable.push(newExam);
      return newExam as any;
    });

    // Mock Exam Queries
    vi.spyOn(client.exam, 'findMany').mockImplementation(async (args: any) => {
      let filtered = [...examTable];
      if (args?.where?.courseId?.in) {
        filtered = filtered.filter(e => args.where.courseId.in.includes(e.courseId));
      } else if (args?.where?.courseId) {
        filtered = filtered.filter(e => e.courseId === args.where.courseId);
      }
      if (args?.where?.examDate?.gte) {
        filtered = filtered.filter(e => new Date(e.examDate) >= args.where.examDate.gte);
      }
      return filtered as any;
    });

    // Mock Courses for Faculty Dashboard
    vi.spyOn(client.course, 'findMany').mockResolvedValue([actualCourseCSE208] as any);
    vi.spyOn(client.course, 'count').mockResolvedValue(1);
    vi.spyOn(client.student, 'count').mockResolvedValue(1);
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.announcement, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.notification, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.assignment, 'findMany').mockResolvedValue([]);
  });

  // ----------------------------------------------------
  // 1. Create Exam via POST /api/faculty/exams
  // ----------------------------------------------------
  it('1. should successfully create Final Examination — Cloud Computing via POST /api/faculty/exams', async () => {
    const payload = {
      courseId: cse208CourseId,
      name: 'Final Examination — Cloud Computing',
      examDate: '2026-10-15T00:00:00.000Z',
      startTime: '09:30 AM',
      endTime: '12:30 PM',
      location: 'Main Examination Hall',
      maxMarks: 100,
    };

    const res = await request(app)
      .post('/api/faculty/exams')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(finalExamId);
    expect(res.body.data.name).toBe('Final Examination — Cloud Computing');
    expect(res.body.data.courseId).toBe(cse208CourseId);
    expect(res.body.data.maxMarks).toBe(100);
    expect(res.body.data.status).toBe('SCHEDULED');
  });

  // ----------------------------------------------------
  // 2. Direct RDS Verification
  // ----------------------------------------------------
  it('2. should verify RDS state: exactly 2 exams exist for CSE208 (Midterm and Final)', async () => {
    expect(examTable).toHaveLength(2);

    const midterm = examTable.find(e => e.id === midtermExamId);
    expect(midterm).toBeDefined();
    expect(midterm.name).toBe('Midterm Examination');
    expect(midterm.status).toBe('COMPLETED');

    const finalExam = examTable.find(e => e.id === finalExamId);
    expect(finalExam).toBeDefined();
    expect(finalExam.name).toBe('Final Examination — Cloud Computing');
    expect(finalExam.status).toBe('SCHEDULED');
  });

  // ----------------------------------------------------
  // 3. Student Retrieval Verification
  // ----------------------------------------------------
  it('3. should verify GET /api/student/exams returns both Midterm and newly created Final Exam', async () => {
    const res = await request(app)
      .get('/api/student/exams')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const finalExam = res.body.data.find((e: any) => e.name === 'Final Examination — Cloud Computing');
    expect(finalExam).toBeDefined();
    expect(finalExam.maxMarks).toBe(100);
    expect(finalExam.status).toBe('SCHEDULED');
  });

  // ----------------------------------------------------
  // 4. Student Dashboard Verification
  // ----------------------------------------------------
  it('4. should expose the future Final Exam in upcomingExams on Karthiks dashboard', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upcomingExams).toBeDefined();

    const upcoming = res.body.data.upcomingExams.find((e: any) => e.name === 'Final Examination — Cloud Computing');
    expect(upcoming).toBeDefined();
  });

  // ----------------------------------------------------
  // 5. Security & Authorization Checks
  // ----------------------------------------------------
  it('5. should reject student token with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/faculty/exams')
      .set('Authorization', `Bearer ${karthikStudentToken}`)
      .send({ courseId: cse208CourseId, name: 'Unauthorized Exam' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('6. should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/faculty/exams')
      .send({ courseId: cse208CourseId, name: 'Unauthorized Exam' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});
