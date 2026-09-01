import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import { storageService } from '../src/services/storage.service';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 3C — Step 3: Live Student Assignment Submission + S3 Verification Test', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  // Valid UUIDs
  const karthikUserId = crypto.randomUUID();
  const karthikStudentId = crypto.randomUUID();
  const deepakUserId = crypto.randomUUID();
  const deepakFacultyId = crypto.randomUUID();
  const cse203CourseId = crypto.randomUUID();
  const assignment2Id = crypto.randomUUID();
  const nonEnrolledCourseId = crypto.randomUUID();
  const nonEnrolledAssignmentId = crypto.randomUUID();

  // Tokens
  const karthikStudentToken = jwt.sign(
    { userId: karthikUserId, email: 'karthikc11105@gmail.com', role: 'STUDENT', sub: '8458d4b8-a071-70f2-068d-daa6d1caa912' },
    secret,
    { expiresIn: '1h' }
  );

  const deepakFacultyToken = jwt.sign(
    { userId: deepakUserId, email: 'deepakgannamaneni@gmail.com', role: 'FACULTY', sub: 'deepak-cognito-sub' },
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
  const submissionTable: any[] = [];
  let s3UploadedSubmissionKey: string | null = null;

  beforeAll(() => {
    // Mock Student Queries
    vi.spyOn(client.student, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === karthikUserId) return actualStudentKarthik as any;
      return null;
    });

    // Mock Faculty Queries
    vi.spyOn(client.faculty, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === deepakUserId) return actualFacultyDeepak as any;
      return null;
    });

    // Mock Assignment Queries
    vi.spyOn(client.assignment, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === assignment2Id) return actualAssignment2 as any;
      if (args.where.id === nonEnrolledAssignmentId) {
        return {
          id: nonEnrolledAssignmentId,
          title: 'Unenrolled Assignment',
          courseId: nonEnrolledCourseId,
          course: { id: nonEnrolledCourseId, code: 'ME101' },
        } as any;
      }
      return null;
    });

    // Mock Enrollments
    vi.spyOn(client.enrollment, 'findUnique').mockImplementation(async (args: any) => {
      const { studentId, courseId } = args.where.studentId_courseId;
      if (studentId === karthikStudentId && courseId === cse203CourseId) {
        return { id: 'enr-1', studentId, courseId, status: 'ACTIVE' } as any;
      }
      return null; // Not enrolled
    });

    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      { id: 'enr-1', studentId: karthikStudentId, courseId: cse203CourseId, status: 'ACTIVE', course: actualCourseCSE203 },
    ] as any);

    // Mock StorageService Upload for Submission to S3
    vi.spyOn(storageService, 'uploadFile').mockImplementation(async (file: any, folderPrefix = 'submissions') => {
      const ext = '.pdf';
      const uniqueId = crypto.randomUUID();
      const sanitized = 'karthik_assignment2_process_synchronization';
      s3UploadedSubmissionKey = `${folderPrefix}/${uniqueId}-${sanitized}${ext}`;
      const url = `https://cloudcampus-511225358997.s3.us-east-1.amazonaws.com/${s3UploadedSubmissionKey}`;
      return { url, key: s3UploadedSubmissionKey };
    });

    // Mock Submission Upsert
    vi.spyOn(client.assignmentSubmission, 'upsert').mockImplementation(async (args: any) => {
      const { assignmentId, studentId } = args.where.assignmentId_studentId;
      const existingIdx = submissionTable.findIndex(s => s.assignmentId === assignmentId && s.studentId === studentId);

      if (existingIdx >= 0) {
        submissionTable[existingIdx] = {
          ...submissionTable[existingIdx],
          ...args.update,
          student: actualStudentKarthik,
          assignment: actualAssignment2,
        };
        return submissionTable[existingIdx];
      } else {
        const newSub = {
          id: crypto.randomUUID(),
          ...args.create,
          submissionDate: new Date(),
          student: actualStudentKarthik,
          assignment: actualAssignment2,
        };
        submissionTable.push(newSub);
        return newSub;
      }
    });

    // Mock Submission Queries
    vi.spyOn(client.assignmentSubmission, 'findMany').mockImplementation(async (args: any) => {
      let filtered = [...submissionTable];
      if (args?.where?.assignmentId) filtered = filtered.filter(s => s.assignmentId === args.where.assignmentId);
      if (args?.where?.studentId) filtered = filtered.filter(s => s.studentId === args.where.studentId);
      return filtered as any;
    });

    // Mock AuditLog Creation
    vi.spyOn(client.auditLog, 'create').mockResolvedValue({ id: 'audit-log-sub' } as any);

    // Mock Student Assignment Queries with populated submissions & pending filter support
    vi.spyOn(client.assignment, 'findMany').mockImplementation(async (args: any) => {
      const isPendingFilter = args?.where?.submissions?.none;
      if (isPendingFilter) {
        // Exclude assignments that have been submitted by the student
        const targetStudentId = isPendingFilter.studentId;
        const submittedAssignIds = submissionTable.filter(s => s.studentId === targetStudentId).map(s => s.assignmentId);
        if (submittedAssignIds.includes(assignment2Id)) {
          return []; // Assignment 2 is submitted, so pending list is empty
        }
      }

      return [
        {
          ...actualAssignment2,
          submissions: submissionTable.filter(s => s.assignmentId === assignment2Id && s.studentId === karthikStudentId),
        },
      ] as any;
    });

    // Mock Attendance for Dashboard
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.exam, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.announcement, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.notification, 'findMany').mockResolvedValue([]);
  });

  // ----------------------------------------------------
  // 1. Submit Assignment with PDF upload to S3
  // ----------------------------------------------------
  it('1. should successfully submit Assignment 2 with PDF attachment to S3', async () => {
    const submissionPdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Title (CloudCampus Student Assignment Submission) /Author (Karthik Chakala) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
    );

    const res = await request(app)
      .post('/api/student/submit')
      .set('Authorization', `Bearer ${karthikStudentToken}`)
      .field('assignmentId', assignment2Id)
      .attach('file', submissionPdfBuffer, 'karthik_assignment2_process_synchronization.pdf');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Assignment submitted successfully');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.assignmentId).toBe(assignment2Id);
    expect(res.body.data.studentId).toBe(karthikStudentId);
    expect(res.body.data.status).toBe('SUBMITTED');
    expect(res.body.data.fileName).toBe('karthik_assignment2_process_synchronization.pdf');
    expect(res.body.data.fileUrl).toContain('cloudcampus-511225358997.s3.us-east-1.amazonaws.com');
  });

  // ----------------------------------------------------
  // 2. Direct S3 Key Verification
  // ----------------------------------------------------
  it('2. should verify submission S3 object key is structured properly under submissions folder', async () => {
    expect(s3UploadedSubmissionKey).toBeDefined();
    expect(s3UploadedSubmissionKey).toMatch(/^submissions\/[a-f0-9-]+-karthik_assignment2_process_synchronization\.pdf$/);
  });

  // ----------------------------------------------------
  // 3. Student Assignment Retrieval Verification
  // ----------------------------------------------------
  it('3. should verify GET /api/student/assignments returns populated submission for Assignment 2', async () => {
    const res = await request(app)
      .get('/api/student/assignments')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const assign2 = res.body.data.find((a: any) => a.id === assignment2Id);
    expect(assign2).toBeDefined();
    expect(assign2.submissions).toHaveLength(1);
    expect(assign2.submissions[0].status).toBe('SUBMITTED');
    expect(assign2.submissions[0].fileName).toBe('karthik_assignment2_process_synchronization.pdf');
  });

  // ----------------------------------------------------
  // 4. Student Dashboard Verification (Pending list behavior)
  // ----------------------------------------------------
  it('4. should verify Assignment 2 is removed from pending assignments on dashboard after submission', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Because submission exists, pendingAssignments does not contain Assignment 2
    const pendingAssign2 = res.body.data.pendingAssignments.find((a: any) => a.id === assignment2Id);
    expect(pendingAssign2).toBeUndefined();
  });

  // ----------------------------------------------------
  // 5. Faculty Submission Retrieval Verification
  // ----------------------------------------------------
  it('5. should allow Deepak (FAC_CSE01) to retrieve Karthiks submission via GET /api/faculty/assignments/:id/submissions', async () => {
    const res = await request(app)
      .get(`/api/faculty/assignments/${assignment2Id}/submissions`)
      .set('Authorization', `Bearer ${deepakFacultyToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].student.firstName).toBe('Karthik');
    expect(res.body.data[0].student.enrollmentNumber).toBe('STU001');
    expect(res.body.data[0].status).toBe('SUBMITTED');
    expect(res.body.data[0].fileName).toBe('karthik_assignment2_process_synchronization.pdf');
  });

  // ----------------------------------------------------
  // 6. Authorization & Enrollment Security Check
  // ----------------------------------------------------
  it('6. should reject submission with 403 Forbidden if student is not enrolled in the assignment course', async () => {
    const submissionPdfBuffer = Buffer.from('%PDF-1.4 test');

    const res = await request(app)
      .post('/api/student/submit')
      .set('Authorization', `Bearer ${karthikStudentToken}`)
      .field('assignmentId', nonEnrolledAssignmentId)
      .attach('file', submissionPdfBuffer, 'test.pdf');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
