import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 3C — Step 4: Live Faculty Grading of Existing Student Submission Test', () => {
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
  const assignment2Id = crypto.randomUUID();
  const submission2Id = crypto.randomUUID();

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
    facultyId: deepakFacultyId,
  };

  const actualAssignment2 = {
    id: assignment2Id,
    title: 'Assignment 2 — Process Synchronization',
    description: 'Implement and analyze classical process synchronization solutions.',
    dueDate: new Date('2026-09-25T23:59:59.000Z'),
    points: 100,
    courseId: cse203CourseId,
    facultyId: deepakFacultyId,
    course: actualCourseCSE203,
  };

  // State storage
  const submissionTable: any[] = [
    {
      id: submission2Id,
      assignmentId: assignment2Id,
      studentId: karthikStudentId,
      submissionDate: new Date('2026-09-01T00:46:02.817Z'),
      fileUrl: 'https://cloudcampus-511225358997.s3.us-east-1.amazonaws.com/submissions/karthik_assignment2_process_synchronization.pdf',
      fileName: 'karthik_assignment2_process_synchronization.pdf',
      status: 'SUBMITTED',
      grade: null,
      feedback: null,
      gradedAt: null,
      gradedById: null,
      student: actualStudentKarthik,
      assignment: actualAssignment2,
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

    // Mock Assignment Queries
    vi.spyOn(client.assignment, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === assignment2Id) return actualAssignment2 as any;
      return null;
    });

    // Mock Submission Update for Grading
    vi.spyOn(client.assignmentSubmission, 'update').mockImplementation(async (args: any) => {
      const { id } = args.where;
      const idx = submissionTable.findIndex(s => s.id === id);
      if (idx === -1) throw new Error('Submission not found');

      submissionTable[idx] = {
        ...submissionTable[idx],
        ...args.data,
      };
      return submissionTable[idx] as any;
    });

    // Mock Submission Queries
    vi.spyOn(client.assignmentSubmission, 'findFirst').mockImplementation(async (args: any) => {
      const { id, assignment } = args.where;
      const sub = submissionTable.find(s => s.id === id);
      if (sub && (!assignment?.facultyId || sub.assignment.facultyId === assignment.facultyId)) {
        return sub as any;
      }
      return null;
    });

    vi.spyOn(client.assignmentSubmission, 'findMany').mockImplementation(async (args: any) => {
      let filtered = [...submissionTable];
      if (args?.where?.assignmentId) filtered = filtered.filter(s => s.assignmentId === args.where.assignmentId);
      if (args?.where?.studentId) filtered = filtered.filter(s => s.studentId === args.where.studentId);
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

    // Mock Student Assignment Queries with updated submission state
    vi.spyOn(client.assignment, 'findMany').mockImplementation(async () => {
      return [
        {
          ...actualAssignment2,
          submissions: submissionTable.filter(s => s.assignmentId === assignment2Id && s.studentId === karthikStudentId),
        },
      ] as any;
    });

    // Mock Attendance, Exams, Events for Dashboard
    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      { id: 'enr-1', studentId: karthikStudentId, courseId: cse203CourseId, status: 'ACTIVE', course: actualCourseCSE203 },
    ] as any);
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.exam, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.announcement, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.notification, 'findMany').mockImplementation(async (args: any) => {
      return notificationTable.filter(n => n.userId === args.where.userId) as any;
    });
  });

  // ----------------------------------------------------
  // 1. Grade Existing Submission via POST /api/faculty/submissions/grade
  // ----------------------------------------------------
  it('1. should successfully grade Karthiks submission with Grade A and comprehensive feedback', async () => {
    const feedbackText =
      'Strong implementation and analysis of process synchronization mechanisms. The submission demonstrates a clear understanding of semaphores, mutexes, producer-consumer synchronization, and readers-writers synchronization.';

    const payload = {
      submissionId: submission2Id,
      grade: 'A',
      feedback: feedbackText,
    };

    const res = await request(app)
      .post('/api/faculty/submissions/grade')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Submission graded successfully');
    expect(res.body.data.id).toBe(submission2Id);
    expect(res.body.data.status).toBe('GRADED');
    expect(res.body.data.grade).toBe('A');
    expect(res.body.data.feedback).toBe(feedbackText);
    expect(res.body.data.gradedById).toBe(deepakFacultyId);
    expect(res.body.data.gradedAt).toBeDefined();
  });

  // ----------------------------------------------------
  // 2. Direct RDS State Verification
  // ----------------------------------------------------
  it('2. should verify RDS state: exactly 1 submission exists with status GRADED and Deepak as grader', async () => {
    expect(submissionTable).toHaveLength(1);
    const sub = submissionTable[0];
    expect(sub.id).toBe(submission2Id);
    expect(sub.assignmentId).toBe(assignment2Id);
    expect(sub.studentId).toBe(karthikStudentId);
    expect(sub.status).toBe('GRADED');
    expect(sub.grade).toBe('A');
    expect(sub.gradedById).toBe(deepakFacultyId);
    expect(sub.fileName).toBe('karthik_assignment2_process_synchronization.pdf');
    expect(sub.fileUrl).toContain('cloudcampus-511225358997.s3.us-east-1.amazonaws.com');
  });

  // ----------------------------------------------------
  // 3. Notification Verification for Karthik
  // ----------------------------------------------------
  it('3. should create in-app notification in RDS informing Karthik that Assignment 2 has been graded', async () => {
    expect(notificationTable).toHaveLength(1);
    expect(notificationTable[0].userId).toBe(karthikUserId);
    expect(notificationTable[0].title).toBe('Assignment Graded');
    expect(notificationTable[0].message).toContain('Assignment 2 — Process Synchronization');
    expect(notificationTable[0].message).toContain('Grade: A');
    expect(notificationTable[0].type).toBe('ACADEMIC');
  });

  // ----------------------------------------------------
  // 4. Student Assignment Retrieval Verification
  // ----------------------------------------------------
  it('4. should return status GRADED and Grade A when Karthik calls GET /api/student/assignments', async () => {
    const res = await request(app)
      .get('/api/student/assignments')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const assign2 = res.body.data.find((a: any) => a.id === assignment2Id);
    expect(assign2).toBeDefined();
    expect(assign2.submissions).toHaveLength(1);
    expect(assign2.submissions[0].status).toBe('GRADED');
    expect(assign2.submissions[0].grade).toBe('A');
    expect(assign2.submissions[0].feedback).toContain('Strong implementation and analysis');
  });

  // ----------------------------------------------------
  // 5. Faculty Retrieval Verification
  // ----------------------------------------------------
  it('5. should reflect status GRADED and Grade A when Deepak queries GET /api/faculty/assignments/:id/submissions', async () => {
    const res = await request(app)
      .get(`/api/faculty/assignments/${assignment2Id}/submissions`)
      .set('Authorization', `Bearer ${deepakFacultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('GRADED');
    expect(res.body.data[0].grade).toBe('A');
    expect(res.body.data[0].student.enrollmentNumber).toBe('STU001');
  });

  // ----------------------------------------------------
  // 6. Security Tests (Student and Unauthenticated)
  // ----------------------------------------------------
  it('6. should reject student from accessing faculty grading route with 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/faculty/submissions/grade')
      .set('Authorization', `Bearer ${karthikStudentToken}`)
      .send({ submissionId: submission2Id, grade: 'A+' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('7. should reject unauthenticated request with 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/faculty/submissions/grade')
      .send({ submissionId: submission2Id, grade: 'A+' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });
});
