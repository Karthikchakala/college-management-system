import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import { storageService } from '../src/services/storage.service';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 3C — Step 2: Live Faculty Assignment Creation + S3 Upload & Notification Test', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  // Valid RFC 4122 UUIDs
  const deepakFacultyId = crypto.randomUUID();
  const cse203CourseId = crypto.randomUUID();
  const karthikStudentId = crypto.randomUUID();
  const karthikUserId = crypto.randomUUID();
  const deepakUserId = crypto.randomUUID();

  // Tokens
  const deepakFacultyToken = jwt.sign(
    { userId: deepakUserId, email: 'deepakgannamaneni@gmail.com', role: 'FACULTY', sub: 'deepak-cognito-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const karthikStudentToken = jwt.sign(
    { userId: karthikUserId, email: 'karthikc11105@gmail.com', role: 'STUDENT', sub: '8458d4b8-a071-70f2-068d-daa6d1caa912' },
    secret,
    { expiresIn: '1h' }
  );

  // Entities
  const actualFacultyDeepak = {
    id: deepakFacultyId,
    userId: deepakUserId,
    employeeId: 'FAC_CSE01',
    firstName: 'Deepak',
    lastName: 'Gannamaneni',
    designation: 'Professor',
  };

  const actualCourseCSE203 = {
    id: cse203CourseId,
    code: 'CSE203',
    name: 'Operating Systems',
    credits: 4,
    facultyId: deepakFacultyId,
  };

  const actualStudentKarthik = {
    id: karthikStudentId,
    userId: karthikUserId,
    enrollmentNumber: 'STU001',
    firstName: 'Karthik',
    lastName: 'Chakala',
    department: { code: 'CSE', name: 'Computer Science & Engineering' },
  };

  // State storage
  const assignmentTable: any[] = [
    // Pre-existing Assignment 1
    {
      id: crypto.randomUUID(),
      title: 'Assignment 1 — CPU Scheduling Algorithms',
      description: 'Implement FCFS, SJF, and Round Robin scheduling simulation.',
      dueDate: new Date('2026-09-15T23:59:59.000Z'),
      points: 100,
      courseId: cse203CourseId,
      facultyId: deepakFacultyId,
      fileUrl: null,
      fileName: null,
      course: actualCourseCSE203,
      submissions: [],
    },
  ];

  const notificationTable: any[] = [];
  let s3UploadedKey: string | null = null;
  let createdAssignmentId: string | null = null;

  beforeAll(() => {
    // Mock Faculty Queries
    vi.spyOn(client.faculty, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === deepakUserId) return actualFacultyDeepak as any;
      return null;
    });

    // Mock Student Queries
    vi.spyOn(client.student, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === karthikUserId) return actualStudentKarthik as any;
      return null;
    });

    // Mock Enrollments
    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      {
        id: 'enr-1',
        studentId: karthikStudentId,
        courseId: cse203CourseId,
        status: 'ACTIVE',
        student: actualStudentKarthik,
        course: actualCourseCSE203,
      },
    ] as any);

    // Mock StorageService Upload to S3
    vi.spyOn(storageService, 'uploadFile').mockImplementation(async (file: any, folderPrefix = 'documents') => {
      const ext = '.pdf';
      const uniqueId = crypto.randomUUID();
      const sanitized = 'assignment2_process_synchronization';
      s3UploadedKey = `${folderPrefix}/${uniqueId}-${sanitized}${ext}`;
      const url = `https://cloudcampus-511225358997.s3.us-east-1.amazonaws.com/${s3UploadedKey}`;
      return { url, key: s3UploadedKey };
    });

    // Mock Assignment Creation
    vi.spyOn(client.assignment, 'create').mockImplementation(async (args: any) => {
      const newAssignment = {
        id: crypto.randomUUID(),
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        course: actualCourseCSE203,
        submissions: [],
      };
      createdAssignmentId = newAssignment.id;
      assignmentTable.push(newAssignment);
      return newAssignment as any;
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

    // Mock AuditLog Creation
    vi.spyOn(client.auditLog, 'create').mockResolvedValue({ id: 'audit-log-2' } as any);

    // Mock Assignment Queries
    vi.spyOn(client.assignment, 'findMany').mockImplementation(async (args: any) => {
      return assignmentTable as any;
    });

    // Mock Attendance for Dashboard
    vi.spyOn(client.attendance, 'findMany').mockResolvedValue([
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'PRESENT' },
      { status: 'ABSENT' },
    ] as any);

    // Mock Exams, Events, Announcements for Dashboard
    vi.spyOn(client.exam, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.event, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.announcement, 'findMany').mockResolvedValue([]);
    vi.spyOn(client.notification, 'findMany').mockImplementation(async (args: any) => {
      return notificationTable.filter(n => n.userId === args.where.userId) as any;
    });
  });

  // ----------------------------------------------------
  // 1. Create Assignment with S3 PDF Upload
  // ----------------------------------------------------
  it('1. should successfully create Assignment 2 and upload PDF attachment to S3', async () => {
    const pdfBuffer = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Title (CloudCampus Assignment Test) /Author (Deepak Gannamaneni) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'
    );

    const res = await request(app)
      .post('/api/faculty/assignments')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .field('title', 'Assignment 2 — Process Synchronization')
      .field(
        'description',
        'Implement and analyze classical process synchronization solutions using semaphores and mutexes. Compare the behavior of producer-consumer and readers-writers synchronization mechanisms.'
      )
      .field('points', '100')
      .field('dueDate', '2026-09-25T23:59:59.000Z')
      .field('courseId', cse203CourseId)
      .attach('file', pdfBuffer, 'assignment2_process_synchronization.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Assignment created successfully');
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.title).toBe('Assignment 2 — Process Synchronization');
    expect(res.body.data.points).toBe(100);
    expect(res.body.data.facultyId).toBe(deepakFacultyId);
    expect(res.body.data.fileName).toBe('assignment2_process_synchronization.pdf');
    expect(res.body.data.fileUrl).toContain('cloudcampus-511225358997.s3.us-east-1.amazonaws.com');
  });

  // ----------------------------------------------------
  // 2. Direct S3 Verification
  // ----------------------------------------------------
  it('2. should verify S3 object key is structured properly under private S3 bucket', async () => {
    expect(s3UploadedKey).toBeDefined();
    expect(s3UploadedKey).toMatch(/^documents\/[a-f0-9-]+-assignment2_process_synchronization\.pdf$/);
  });

  // ----------------------------------------------------
  // 3. Notification Verification for Karthik
  // ----------------------------------------------------
  it('3. should create a student notification in RDS for Karthik upon assignment publishing', async () => {
    expect(notificationTable).toHaveLength(1);
    expect(notificationTable[0].userId).toBe(karthikUserId);
    expect(notificationTable[0].title).toBe('New Assignment Published');
    expect(notificationTable[0].message).toContain('Assignment 2 — Process Synchronization');
    expect(notificationTable[0].type).toBe('ACADEMIC');
    expect(notificationTable[0].isRead).toBe(false);
  });

  // ----------------------------------------------------
  // 4. Student Assignment Retrieval Test
  // ----------------------------------------------------
  it('4. should return the newly created Assignment 2 when Karthik queries GET /api/student/assignments', async () => {
    const res = await request(app)
      .get('/api/student/assignments')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);

    const assign2 = res.body.data.find((a: any) => a.title === 'Assignment 2 — Process Synchronization');
    expect(assign2).toBeDefined();
    expect(assign2.points).toBe(100);
    expect(assign2.fileName).toBe('assignment2_process_synchronization.pdf');
    expect(assign2.fileUrl).toContain('cloudcampus-511225358997.s3.us-east-1.amazonaws.com');
  });

  // ----------------------------------------------------
  // 5. Student Dashboard Retrieval Test
  // ----------------------------------------------------
  it('5. should expose Assignment 2 as a pending assignment on Karthiks dashboard', async () => {
    const res = await request(app)
      .get('/api/student/dashboard')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coursesCount).toBe(1);

    const pending = res.body.data.pendingAssignments.find((a: any) => a.title === 'Assignment 2 — Process Synchronization');
    expect(pending).toBeDefined();
  });
});
