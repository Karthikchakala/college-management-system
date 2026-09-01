import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 4 — Step 5: Live Faculty Exam Retrieval & Authorization Audit', () => {
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
  const midtermExamId = crypto.randomUUID();
  const finalExamId = crypto.randomUUID();
  const midtermResultId = crypto.randomUUID();
  const finalResultId = crypto.randomUUID();

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

  const actualCourseCSE208 = {
    id: cse208CourseId,
    code: 'CSE208',
    name: 'Cloud Computing',
    credits: 3,
    facultyId: shaikFacultyId, // Owned by Shaik
  };

  // State storage
  const examTable: any[] = [
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
    },
    {
      id: finalExamId,
      name: 'Final Examination — Cloud Computing',
      examDate: new Date('2026-10-15T00:00:00.000Z'),
      startTime: '09:30 AM',
      endTime: '12:30 PM',
      location: 'Main Examination Hall',
      maxMarks: 100,
      courseId: cse208CourseId,
      status: 'SCHEDULED',
      course: actualCourseCSE208,
    },
  ];

  const resultTable: any[] = [
    {
      id: midtermResultId,
      examId: midtermExamId,
      studentId: karthikStudentId,
      marksObtained: 92.5,
      grade: 'A',
      status: 'PUBLISHED',
      exam: examTable[0],
    },
    {
      id: finalResultId,
      examId: finalExamId,
      studentId: karthikStudentId,
      marksObtained: 88,
      grade: 'A',
      status: 'PUBLISHED',
      exam: examTable[1],
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

    // Mock Course Queries
    vi.spyOn(client.course, 'findMany').mockImplementation(async (args: any) => {
      if (args?.where?.facultyId === deepakFacultyId) return [actualCourseCSE203] as any;
      if (args?.where?.facultyId === shaikFacultyId) return [actualCourseCSE208] as any;
      return [actualCourseCSE203, actualCourseCSE208] as any;
    });

    // Mock Enrollments
    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      { id: 'enr-1', studentId: karthikStudentId, courseId: cse208CourseId, status: 'ACTIVE', course: actualCourseCSE208 },
    ] as any);

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
      if (args?.where?.status) {
        filtered = filtered.filter(e => e.status === args.where.status);
      }
      return filtered as any;
    });

    // Mock Result Queries
    vi.spyOn(client.result, 'findMany').mockImplementation(async (args: any) => {
      return resultTable.filter(r => r.studentId === args.where.studentId && r.status === args.where.status) as any;
    });

    // Mock Counts
    vi.spyOn(client.exam, 'count').mockResolvedValue(2);
    vi.spyOn(client.result, 'count').mockResolvedValue(2);
    vi.spyOn(client.course, 'count').mockResolvedValue(12);
    vi.spyOn(client.enrollment, 'count').mockResolvedValue(15);
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.announcement, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.notification, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.assignment, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.assignmentSubmission, 'count').mockResolvedValue(0);
  });

  // ----------------------------------------------------
  // Test 1: Faculty Dashboard Exam Retrieval for Shaik (Owner of CSE208)
  // ----------------------------------------------------
  it('1. should surface upcoming exam for CSE208 when Shaik (owner) calls GET /api/faculty/dashboard', async () => {
    const res = await request(app)
      .get('/api/faculty/dashboard')
      .set('Authorization', `Bearer ${shaikFacultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upcomingExams).toBeDefined();

    const upcoming = res.body.data.upcomingExams.find((e: any) => e.name === 'Final Examination — Cloud Computing');
    expect(upcoming).toBeDefined();
    expect(upcoming.status).toBe('SCHEDULED');
  });

  // ----------------------------------------------------
  // Test 2: Faculty Dashboard Exam Scoping for Deepak (Does not own CSE208)
  // ----------------------------------------------------
  it('2. should NOT expose CSE208 exams when Deepak calls GET /api/faculty/dashboard (Strictly scoped to Deepak courses)', async () => {
    const res = await request(app)
      .get('/api/faculty/dashboard')
      .set('Authorization', `Bearer ${deepakFacultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Deepak owns CSE203, not CSE208, so upcomingExams should be empty for Deepak
    expect(res.body.data.upcomingExams).toHaveLength(0);
  });

  // ----------------------------------------------------
  // Test 3: Student Exam Retrieval (GET /api/student/exams)
  // ----------------------------------------------------
  it('3. should return both Midterm and Final exams when Karthik calls GET /api/student/exams', async () => {
    const res = await request(app)
      .get('/api/student/exams')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const midterm = res.body.data.find((e: any) => e.name === 'Midterm Examination');
    expect(midterm).toBeDefined();
    expect(midterm.status).toBe('COMPLETED');

    const finalExam = res.body.data.find((e: any) => e.name === 'Final Examination — Cloud Computing');
    expect(finalExam).toBeDefined();
    expect(finalExam.status).toBe('SCHEDULED');
  });

  // ----------------------------------------------------
  // Test 4: Student Dashboard upcomingExams Filtering
  // ----------------------------------------------------
  it('4. should expose ONLY the SCHEDULED future Final Exam in upcomingExams on Karthiks dashboard', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.upcomingExams).toHaveLength(1);
    expect(res.body.data.upcomingExams[0].name).toBe('Final Examination — Cloud Computing');
  });

  // ----------------------------------------------------
  // Test 5: Result Records Integrity
  // ----------------------------------------------------
  it('5. should verify that Result records for Midterm (92.5) and Final (88) remain 100% intact', async () => {
    const res = await request(app)
      .get('/api/student/results')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const midResult = res.body.data.find((r: any) => r.exam.name === 'Midterm Examination');
    expect(midResult.marksObtained).toBe(92.5);
    expect(midResult.grade).toBe('A');

    const finalResult = res.body.data.find((r: any) => r.exam.name === 'Final Examination — Cloud Computing');
    expect(finalResult.marksObtained).toBe(88);
    expect(finalResult.grade).toBe('A');
  });

  // ----------------------------------------------------
  // Test 6: Route audit - standalone GET /api/faculty/exams returns 404 because not mounted
  // ----------------------------------------------------
  it('6. should return 404 for unmounted route GET /api/faculty/exams', async () => {
    const res = await request(app)
      .get('/api/faculty/exams')
      .set('Authorization', `Bearer ${deepakFacultyToken}`);

    expect(res.status).toBe(404);
  });
});
