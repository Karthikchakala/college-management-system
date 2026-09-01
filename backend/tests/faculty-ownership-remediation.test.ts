import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 5 Remediation: Faculty Resource Ownership Verification', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  // Primary Entities & UUIDs
  const karthikUserId = crypto.randomUUID();
  const karthikStudentId = crypto.randomUUID();

  const deepakUserId = crypto.randomUUID();
  const deepakFacultyId = crypto.randomUUID();
  const shaikUserId = crypto.randomUUID();
  const shaikFacultyId = crypto.randomUUID();

  const cse203CourseId = crypto.randomUUID(); // Deepak owns CSE203
  const cse204CourseId = crypto.randomUUID(); // Shaik owns CSE204

  const deepakAssignmentId = crypto.randomUUID();
  const shaikAssignmentId = crypto.randomUUID();

  const deepakSubmissionId = crypto.randomUUID();
  const shaikSubmissionId = crypto.randomUUID();

  const deepakExamId = crypto.randomUUID();
  const shaikExamId = crypto.randomUUID();

  // Tokens
  const deepakFacultyToken = jwt.sign(
    { userId: deepakUserId, email: 'deepakgannamaneni@gmail.com', role: 'FACULTY', sub: 'deepak-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const shaikFacultyToken = jwt.sign(
    { userId: shaikUserId, email: 'shaikvenkat17@gmail.com', role: 'FACULTY', sub: 'shaik-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const karthikStudentToken = jwt.sign(
    { userId: karthikUserId, email: 'karthikc11105@gmail.com', role: 'STUDENT', sub: 'karthik-sub' },
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
    facultyId: deepakFacultyId,
  };

  const actualCourseCSE204 = {
    id: cse204CourseId,
    code: 'CSE204',
    name: 'Computer Networks',
    facultyId: shaikFacultyId,
  };

  const actualDeepakAssignment = {
    id: deepakAssignmentId,
    title: 'OS Process Sync',
    courseId: cse203CourseId,
    facultyId: deepakFacultyId,
  };

  const actualShaikAssignment = {
    id: shaikAssignmentId,
    title: 'CN Packet Tracer',
    courseId: cse204CourseId,
    facultyId: shaikFacultyId,
  };

  const actualDeepakSubmission = {
    id: deepakSubmissionId,
    assignmentId: deepakAssignmentId,
    studentId: karthikStudentId,
    status: 'SUBMITTED',
    grade: null,
    student: actualStudentKarthik,
    assignment: actualDeepakAssignment,
  };

  const actualShaikSubmission = {
    id: shaikSubmissionId,
    assignmentId: shaikAssignmentId,
    studentId: karthikStudentId,
    status: 'SUBMITTED',
    grade: null,
    student: actualStudentKarthik,
    assignment: actualShaikAssignment,
  };

  const actualDeepakExam = {
    id: deepakExamId,
    name: 'OS Midterm',
    courseId: cse203CourseId,
    maxMarks: 100,
    status: 'SCHEDULED',
    course: actualCourseCSE203,
  };

  const actualShaikExam = {
    id: shaikExamId,
    name: 'CN Midterm',
    courseId: cse204CourseId,
    maxMarks: 100,
    status: 'SCHEDULED',
    course: actualCourseCSE204,
  };

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

    // Mock Course Ownership Queries
    vi.spyOn(client.course, 'findFirst').mockImplementation(async (args: any) => {
      const { id, facultyId } = args.where;
      if (id === cse203CourseId && facultyId === deepakFacultyId) return actualCourseCSE203 as any;
      if (id === cse204CourseId && facultyId === shaikFacultyId) return actualCourseCSE204 as any;
      return null;
    });

    // Mock Exam Ownership Queries
    vi.spyOn(client.exam, 'findFirst').mockImplementation(async (args: any) => {
      const { id, course } = args.where;
      if (id === deepakExamId && course?.facultyId === deepakFacultyId) return actualDeepakExam as any;
      if (id === shaikExamId && course?.facultyId === shaikFacultyId) return actualShaikExam as any;
      return null;
    });

    // Mock Exam Creation
    vi.spyOn(client.exam, 'create').mockImplementation(async (args: any) => {
      return { id: crypto.randomUUID(), ...args.data } as any;
    });

    // Mock Submission Ownership Queries
    vi.spyOn(client.assignmentSubmission, 'findFirst').mockImplementation(async (args: any) => {
      const { id, assignment } = args.where;
      if (id === deepakSubmissionId && assignment?.facultyId === deepakFacultyId) return actualDeepakSubmission as any;
      if (id === shaikSubmissionId && assignment?.facultyId === shaikFacultyId) return actualShaikSubmission as any;
      return null;
    });

    // Mock Submission Update
    vi.spyOn(client.assignmentSubmission, 'update').mockImplementation(async (args: any) => {
      return {
        ...actualDeepakSubmission,
        ...args.data,
      } as any;
    });

    // Mock Transaction for Result Entry
    vi.spyOn(client, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        result: {
          upsert: async () => ({ id: 'res-new', grade: 'A', marksObtained: 85, status: 'DRAFT' }),
        },
      };
      return callback(tx);
    });

    // Mock Result Update for Publishing
    vi.spyOn(client.result, 'updateMany').mockResolvedValue({ count: 1 } as any);
    vi.spyOn(client.result, 'findMany').mockResolvedValue([
      { id: 'res-1', grade: 'A', student: actualStudentKarthik, exam: actualDeepakExam },
    ] as any);

    // Mock Notifications
    vi.spyOn(client.notification, 'create').mockResolvedValue({ id: 'notif-1' } as any);
  });

  // ====================================================
  // 1. Exam Creation Ownership
  // ====================================================
  describe('Exam Creation Ownership (createExam)', () => {
    it('1. should allow Deepak (FAC_CSE01) to create exam for CSE203 (owned)', async () => {
      const payload = {
        courseId: cse203CourseId,
        name: 'OS Midterm 2',
        examDate: '2026-10-20T09:30:00.000Z',
        startTime: '09:30 AM',
        endTime: '11:30 AM',
        location: 'LH-101',
        maxMarks: 100,
      };
      const res = await request(app)
        .post('/api/faculty/exams')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('2. should reject Deepak (FAC_CSE01) with 403 when attempting to create exam for CSE204 (owned by Shaik)', async () => {
      const payload = {
        courseId: cse204CourseId,
        name: 'CN Midterm 2',
        examDate: '2026-10-20T09:30:00.000Z',
        startTime: '09:30 AM',
        endTime: '11:30 AM',
        location: 'LH-102',
        maxMarks: 100,
      };
      const res = await request(app)
        .post('/api/faculty/exams')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('3. should reject Shaik (FAC_CSE03) with 403 when attempting to create exam for CSE203 (owned by Deepak)', async () => {
      const payload = {
        courseId: cse203CourseId,
        name: 'OS Attempt',
        examDate: '2026-10-20T09:30:00.000Z',
        startTime: '09:30 AM',
        endTime: '11:30 AM',
        location: 'LH-101',
        maxMarks: 100,
      };
      const res = await request(app)
        .post('/api/faculty/exams')
        .set('Authorization', `Bearer ${shaikFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // ====================================================
  // 2. Result Entry Ownership (enterResults)
  // ====================================================
  describe('Result Entry Ownership (enterResults)', () => {
    it('4. should allow Deepak to enter results for his own exam (OS Midterm)', async () => {
      const payload = {
        examId: deepakExamId,
        results: [{ studentId: karthikStudentId, marksObtained: 88, remarks: 'Good work' }],
      };
      const res = await request(app)
        .post('/api/faculty/results/enter')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('5. should reject Deepak with 403 when attempting to enter results for Shaik examId', async () => {
      const payload = {
        examId: shaikExamId,
        results: [{ studentId: karthikStudentId, marksObtained: 88 }],
      };
      const res = await request(app)
        .post('/api/faculty/results/enter')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('6. should reject Shaik with 403 when attempting to enter results for Deepak examId', async () => {
      const payload = {
        examId: deepakExamId,
        results: [{ studentId: karthikStudentId, marksObtained: 88 }],
      };
      const res = await request(app)
        .post('/api/faculty/results/enter')
        .set('Authorization', `Bearer ${shaikFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // ====================================================
  // 3. Result Publication Ownership (publishResults)
  // ====================================================
  describe('Result Publication Ownership (publishResults)', () => {
    it('7. should allow Deepak to publish results for his own exam', async () => {
      const res = await request(app)
        .post('/api/faculty/results/publish')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send({ examId: deepakExamId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('8. should reject Deepak with 403 when attempting to publish Shaik exam', async () => {
      const res = await request(app)
        .post('/api/faculty/results/publish')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send({ examId: shaikExamId });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('9. should reject Shaik with 403 when attempting to publish Deepak exam', async () => {
      const res = await request(app)
        .post('/api/faculty/results/publish')
        .set('Authorization', `Bearer ${shaikFacultyToken}`)
        .send({ examId: deepakExamId });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // ====================================================
  // 4. Submission Grading Ownership (gradeSubmission)
  // ====================================================
  describe('Submission Grading Ownership (gradeSubmission)', () => {
    it('10. should allow Deepak to grade a submission from Deepak course', async () => {
      const payload = {
        submissionId: deepakSubmissionId,
        grade: 'A',
        feedback: 'Excellent synchronization implementation',
      };
      const res = await request(app)
        .post('/api/faculty/submissions/grade')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('11. should reject Deepak with 403 when attempting to grade submission from Shaik course', async () => {
      const payload = {
        submissionId: shaikSubmissionId,
        grade: 'A',
      };
      const res = await request(app)
        .post('/api/faculty/submissions/grade')
        .set('Authorization', `Bearer ${deepakFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('12. should reject Shaik with 403 when attempting to grade submission from Deepak course', async () => {
      const payload = {
        submissionId: deepakSubmissionId,
        grade: 'A',
      };
      const res = await request(app)
        .post('/api/faculty/submissions/grade')
        .set('Authorization', `Bearer ${shaikFacultyToken}`)
        .send(payload);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  // ====================================================
  // 5. Unauthenticated & Student Token Gates
  // ====================================================
  describe('Authentication & Role Validation', () => {
    it('13. should reject unauthenticated request with 401', async () => {
      const res = await request(app).post('/api/faculty/exams').send({});
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('14. should reject student token with 403', async () => {
      const res = await request(app)
        .post('/api/faculty/exams')
        .set('Authorization', `Bearer ${karthikStudentToken}`)
        .send({});
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
