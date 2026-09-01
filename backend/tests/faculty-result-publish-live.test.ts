import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 3C — Step 6: Live Faculty Result Entry and Publication Test', () => {
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
  };

  const actualFacultyShaik = {
    id: shaikFacultyId,
    userId: shaikUserId,
    employeeId: 'FAC_CSE03',
    firstName: 'Shaik',
    lastName: 'Venkat',
  };

  const actualCourseCSE208 = {
    id: cse208CourseId,
    code: 'CSE208',
    name: 'Cloud Computing',
    credits: 4,
    facultyId: deepakFacultyId,
  };

  const actualMidtermExam = {
    id: midtermExamId,
    name: 'Midterm Examination',
    examDate: new Date('2026-08-25T09:30:00.000Z'),
    maxMarks: 100,
    courseId: cse208CourseId,
    status: 'COMPLETED',
    course: actualCourseCSE208,
  };

  const actualFinalExam = {
    id: finalExamId,
    name: 'Final Examination — Cloud Computing',
    examDate: new Date('2026-10-15T00:00:00.000Z'),
    maxMarks: 100,
    courseId: cse208CourseId,
    status: 'SCHEDULED',
    course: actualCourseCSE208,
  };

  // State storage
  const resultTable: any[] = [
    // Pre-existing Midterm Result (92.5/100, Grade A, PUBLISHED)
    {
      id: midtermResultId,
      examId: midtermExamId,
      studentId: karthikStudentId,
      marksObtained: 92.5,
      grade: 'A',
      remarks: 'Outstanding performance on AWS Architecture and distributed principles',
      status: 'PUBLISHED',
      exam: actualMidtermExam,
      student: actualStudentKarthik,
    },
  ];

  const notificationTable: any[] = [];

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

    // Mock Exam Queries
    vi.spyOn(client.exam, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === finalExamId) return actualFinalExam as any;
      if (args.where.id === midtermExamId) return actualMidtermExam as any;
      return null;
    });

    vi.spyOn(client.exam, 'findFirst').mockImplementation(async (args: any) => {
      const { id, course } = args.where;
      const targetExam = id === finalExamId ? actualFinalExam : id === midtermExamId ? actualMidtermExam : null;
      if (targetExam && (!course?.facultyId || targetExam.course.facultyId === course.facultyId)) {
        return targetExam as any;
      }
      return null;
    });

    // Mock Transactional Upsert for Result Entry
    vi.spyOn(client, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        result: {
          upsert: async (args: any) => {
            const { examId, studentId } = args.where.examId_studentId;
            const existingIdx = resultTable.findIndex(r => r.examId === examId && r.studentId === studentId);

            if (existingIdx >= 0) {
              resultTable[existingIdx] = {
                ...resultTable[existingIdx],
                ...args.update,
                exam: actualFinalExam,
                student: actualStudentKarthik,
              };
              return resultTable[existingIdx];
            } else {
              const newRes = {
                id: finalResultId,
                ...args.create,
                exam: actualFinalExam,
                student: actualStudentKarthik,
              };
              resultTable.push(newRes);
              return newRes;
            }
          },
        },
      };
      return callback(tx);
    });

    // Mock Result updateMany for Publishing
    vi.spyOn(client.result, 'updateMany').mockImplementation(async (args: any) => {
      let count = 0;
      resultTable.forEach(r => {
        if (r.examId === args.where.examId) {
          r.status = args.data.status;
          count++;
        }
      });
      return { count } as any;
    });

    // Mock Result findMany
    vi.spyOn(client.result, 'findMany').mockImplementation(async (args: any) => {
      let filtered = [...resultTable];
      if (args?.where?.examId) filtered = filtered.filter(r => r.examId === args.where.examId);
      if (args?.where?.studentId) filtered = filtered.filter(r => r.studentId === args.where.studentId);
      if (args?.where?.status) filtered = filtered.filter(r => r.status === args.where.status);
      return filtered as any;
    });

    // Mock Notification Creation
    vi.spyOn(client.notification, 'create').mockImplementation(async (args: any) => {
      const newNotif = {
        id: crypto.randomUUID(),
        ...args.data,
        isRead: false,
        createdAt: new Date(),
      };
      notificationTable.push(newNotif);
      return newNotif as any;
    });

    // Mock Enrollments
    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      { id: 'enr-cse208', studentId: karthikStudentId, courseId: cse208CourseId, status: 'ACTIVE', course: actualCourseCSE208 },
    ] as any);

    // Mock Attendance, Exams, Events, Dashboard
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.exam, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.assignment, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.announcement, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.notification, 'findMany').mockImplementation(async (args: any) => {
      return notificationTable.filter(n => n.userId === args.where.userId) as any;
    });
  });

  // ----------------------------------------------------
  // 1. Enter Draft Results via POST /api/faculty/results/enter
  // ----------------------------------------------------
  it('1. should enter results for Karthik in DRAFT status with 88/100 and Grade A', async () => {
    const payload = {
      examId: finalExamId,
      results: [
        {
          studentId: karthikStudentId,
          marksObtained: 88,
          remarks: 'Excellent performance on Cloud Architecture and Distributed Systems',
        },
      ],
    };

    const res = await request(app)
      .post('/api/faculty/results/enter')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Exam results saved as draft');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].marksObtained).toBe(88);
    expect(res.body.data[0].grade).toBe('A');
    expect(res.body.data[0].status).toBe('DRAFT');

    // Confirm pre-existing Midterm result is untouched
    const midtermRes = resultTable.find(r => r.id === midtermResultId);
    expect(midtermRes.marksObtained).toBe(92.5);
    expect(midtermRes.status).toBe('PUBLISHED');
  });

  // ----------------------------------------------------
  // 2. Draft Result Hidden from Student
  // ----------------------------------------------------
  it('2. should NOT expose DRAFT results to Karthik when calling GET /api/student/results', async () => {
    const res = await request(app)
      .get('/api/student/results')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Only Midterm result is returned because status is PUBLISHED
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].exam.name).toBe('Midterm Examination');
  });

  // ----------------------------------------------------
  // 3. Publish Results via POST /api/faculty/results/publish
  // ----------------------------------------------------
  it('3. should successfully publish Final Examination results and create student notification', async () => {
    const payload = {
      examId: finalExamId,
    };

    const res = await request(app)
      .post('/api/faculty/results/publish')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Exam results published successfully');

    // Verify status became PUBLISHED in result table
    const finalRes = resultTable.find(r => r.id === finalResultId);
    expect(finalRes.status).toBe('PUBLISHED');

    // Verify Notification generated for Karthik
    expect(notificationTable).toHaveLength(1);
    expect(notificationTable[0].userId).toBe(karthikUserId);
    expect(notificationTable[0].title).toBe('Exam Results Published');
    expect(notificationTable[0].message).toContain('Final Examination — Cloud Computing');
    expect(notificationTable[0].type).toBe('EXAM');
  });

  // ----------------------------------------------------
  // 4. Student Retrieval after Publication
  // ----------------------------------------------------
  it('4. should return BOTH Midterm (92.5/100) and Final Exam (88/100) when Karthik calls GET /api/student/results', async () => {
    const res = await request(app)
      .get('/api/student/results')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const midterm = res.body.data.find((r: any) => r.exam.name === 'Midterm Examination');
    expect(midterm).toBeDefined();
    expect(midterm.marksObtained).toBe(92.5);
    expect(midterm.grade).toBe('A');

    const finalResult = res.body.data.find((r: any) => r.exam.name === 'Final Examination — Cloud Computing');
    expect(finalResult).toBeDefined();
    expect(finalResult.marksObtained).toBe(88);
    expect(finalResult.grade).toBe('A');
    expect(finalResult.status).toBe('PUBLISHED');
  });

  // ----------------------------------------------------
  // 5. Security & Authorization Checks
  // ----------------------------------------------------
  it('5. should reject student from entering results with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/faculty/results/enter')
      .set('Authorization', `Bearer ${karthikStudentToken}`)
      .send({ examId: finalExamId, results: [] });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('6. should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/faculty/results/enter')
      .send({ examId: finalExamId, results: [] });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});
