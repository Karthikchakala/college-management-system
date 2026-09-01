import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getPrismaClient } from '../src/config/db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

describe('Phase 3C — Step 1: Live Faculty Attendance Mutation & Idempotency Test', () => {
  const secret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  const client = getPrismaClient();

  // Valid RFC 4122 UUIDs generated via crypto.randomUUID()
  const deepakFacultyId = crypto.randomUUID();
  const shaikFacultyId = crypto.randomUUID();
  const cse203CourseId = crypto.randomUUID();
  const karthikStudentId = crypto.randomUUID();
  const deptCseId = crypto.randomUUID();

  // Tokens
  const deepakFacultyToken = jwt.sign(
    { userId: 'deepak-user-id-001', email: 'deepakgannamaneni@gmail.com', role: 'FACULTY', sub: 'deepak-cognito-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const shaikFacultyToken = jwt.sign(
    { userId: 'shaik-user-id-003', email: 'shaikvenkat17@gmail.com', role: 'FACULTY', sub: 'shaik-cognito-sub' },
    secret,
    { expiresIn: '1h' }
  );

  const karthikStudentToken = jwt.sign(
    { userId: 'karthik-user-id-001', email: 'karthikc11105@gmail.com', role: 'STUDENT', sub: '8458d4b8-a071-70f2-068d-daa6d1caa912' },
    secret,
    { expiresIn: '1h' }
  );

  // Entities
  const actualFacultyDeepak = {
    id: deepakFacultyId,
    userId: 'deepak-user-id-001',
    employeeId: 'FAC_CSE01',
    firstName: 'Deepak',
    lastName: 'Gannamaneni',
    designation: 'Professor',
  };

  const actualFacultyShaik = {
    id: shaikFacultyId,
    userId: 'shaik-user-id-003',
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

  const actualStudentKarthik = {
    id: karthikStudentId,
    userId: 'karthik-user-id-001',
    enrollmentNumber: 'STU001',
    firstName: 'Karthik',
    lastName: 'Chakala',
    departmentId: deptCseId,
  };

  // In-memory store simulating RDS state
  const attendanceTable: any[] = [
    // Pre-existing 5 sessions for CSE203 (4 Present, 1 Absent)
    { id: 'att-1', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-18T00:00:00.000Z'), status: 'PRESENT', remarks: null },
    { id: 'att-2', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-20T00:00:00.000Z'), status: 'PRESENT', remarks: null },
    { id: 'att-3', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-22T00:00:00.000Z'), status: 'ABSENT', remarks: 'Medical leave' },
    { id: 'att-4', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-25T00:00:00.000Z'), status: 'PRESENT', remarks: null },
    { id: 'att-5', studentId: karthikStudentId, courseId: cse203CourseId, date: new Date('2026-08-27T00:00:00.000Z'), status: 'PRESENT', remarks: null },
  ];

  beforeAll(() => {
    // Mock Faculty Queries
    vi.spyOn(client.faculty, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === 'deepak-user-id-001') return actualFacultyDeepak as any;
      if (args.where.userId === 'shaik-user-id-003') return actualFacultyShaik as any;
      return null;
    });

    // Mock Course Queries
    vi.spyOn(client.course, 'findFirst').mockImplementation(async (args: any) => {
      if (args.where.id === cse203CourseId && args.where.facultyId === deepakFacultyId) {
        return actualCourseCSE203 as any;
      }
      return null; // Return null if faculty does not own course
    });

    // Mock Student Queries
    vi.spyOn(client.student, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.userId === 'karthik-user-id-001') return actualStudentKarthik as any;
      return null;
    });

    // Mock Enrollments
    vi.spyOn(client.enrollment, 'findMany').mockResolvedValue([
      {
        id: 'enr-1',
        studentId: karthikStudentId,
        courseId: cse203CourseId,
        status: 'ACTIVE',
        course: actualCourseCSE203,
      },
    ] as any);

    // Mock Transactional Upsert for Attendance
    vi.spyOn(client, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        attendance: {
          upsert: async (args: any) => {
            const { studentId, courseId, date } = args.where.studentId_courseId_date;
            const existingIndex = attendanceTable.findIndex(
              a => a.studentId === studentId && a.courseId === courseId && new Date(a.date).toISOString().slice(0, 10) === new Date(date).toISOString().slice(0, 10)
            );

            if (existingIndex >= 0) {
              attendanceTable[existingIndex] = {
                ...attendanceTable[existingIndex],
                status: args.update.status,
                remarks: args.update.remarks,
                updatedAt: new Date(),
              };
              return attendanceTable[existingIndex];
            } else {
              const newRecord = {
                id: `att-live-${attendanceTable.length + 1}`,
                studentId,
                courseId,
                date: new Date(date),
                status: args.create.status,
                remarks: args.create.remarks,
                createdAt: new Date(),
              };
              attendanceTable.push(newRecord);
              return newRecord;
            }
          },
        },
        auditLog: {
          create: async () => ({ id: 'audit-log-1' }),
        },
      };
      return callback(tx);
    });

    // Mock Attendance findMany
    vi.spyOn(client.attendance, 'findMany').mockImplementation(async (args: any) => {
      let filtered = [...attendanceTable];
      if (args?.where?.studentId) filtered = filtered.filter(a => a.studentId === args.where.studentId);
      if (args?.where?.courseId) filtered = filtered.filter(a => a.courseId === args.where.courseId);
      return filtered as any;
    });
  });

  // ----------------------------------------------------
  // Step 1: Execute POST /api/faculty/attendance
  // ----------------------------------------------------
  it('1. should successfully record attendance for Karthik on 2026-09-02 by Deepak (FAC_CSE01)', async () => {
    const payload = {
      courseId: cse203CourseId,
      date: '2026-09-02',
      records: [
        {
          studentId: karthikStudentId,
          status: 'PRESENT',
          remarks: 'Phase 3C live API verification',
        },
      ],
    };

    const res = await request(app)
      .post('/api/faculty/attendance')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Attendance recorded successfully');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].status).toBe('PRESENT');
    expect(res.body.data[0].remarks).toBe('Phase 3C live API verification');

    // Verify record exists in attendance table
    const created = attendanceTable.find(
      a => a.studentId === karthikStudentId && a.courseId === cse203CourseId && new Date(a.date).toISOString().slice(0, 10) === '2026-09-02'
    );
    expect(created).toBeDefined();
    expect(created.status).toBe('PRESENT');
    expect(created.remarks).toBe('Phase 3C live API verification');
  });

  // ----------------------------------------------------
  // Step 2: Verify Student Attendance Reflection
  // ----------------------------------------------------
  it('2. should reflect the new session (5 present / 6 total = 83.33%) when Karthik calls GET /api/student/attendance', async () => {
    const res = await request(app)
      .get('/api/student/attendance')
      .set('Authorization', `Bearer ${karthikStudentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const cse203Attendance = res.body.data.find((a: any) => a.courseCode === 'CSE203');
    expect(cse203Attendance).toBeDefined();
    expect(cse203Attendance.present).toBe(5); // 4 previous + 1 new
    expect(cse203Attendance.absent).toBe(1);
    expect(cse203Attendance.total).toBe(6); // 5 previous + 1 new
    expect(cse203Attendance.percentage).toBe(83.33); // (5 / 6) * 100 = 83.33%
  });

  // ----------------------------------------------------
  // Step 3: Idempotency Test (Send exact same request again)
  // ----------------------------------------------------
  it('3. should be 100% idempotent: sending exact same request must update, not duplicate', async () => {
    const initialCount = attendanceTable.filter(
      a => a.studentId === karthikStudentId && a.courseId === cse203CourseId && new Date(a.date).toISOString().slice(0, 10) === '2026-09-02'
    ).length;
    expect(initialCount).toBe(1);

    const payload = {
      courseId: cse203CourseId,
      date: '2026-09-02',
      records: [
        {
          studentId: karthikStudentId,
          status: 'PRESENT',
          remarks: 'Phase 3C live API verification (idempotent repeat)',
        },
      ],
    };

    const res = await request(app)
      .post('/api/faculty/attendance')
      .set('Authorization', `Bearer ${deepakFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const finalRecords = attendanceTable.filter(
      a => a.studentId === karthikStudentId && a.courseId === cse203CourseId && new Date(a.date).toISOString().slice(0, 10) === '2026-09-02'
    );
    expect(finalRecords).toHaveLength(1); // EXACTLY 1 RECORD, ZERO DUPLICATES
    expect(finalRecords[0].remarks).toBe('Phase 3C live API verification (idempotent repeat)');
  });

  // ----------------------------------------------------
  // Step 4: Security & Ownership Check
  // ----------------------------------------------------
  it('4. should reject with 403 Forbidden if another faculty (Shaik Venkat) attempts to mark attendance for Deepak course (CSE203)', async () => {
    const payload = {
      courseId: cse203CourseId, // Owned by Deepak, not Shaik
      date: '2026-09-03',
      records: [
        {
          studentId: karthikStudentId,
          status: 'PRESENT',
          remarks: 'Unauthorized attempt',
        },
      ],
    };

    const res = await request(app)
      .post('/api/faculty/attendance')
      .set('Authorization', `Bearer ${shaikFacultyToken}`)
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});
