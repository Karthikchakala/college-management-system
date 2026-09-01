import { PrismaClient, AttendanceStatus, SubmissionStatus, ExamStatus, ResultStatus } from '@prisma/client';
import { getDatabaseUrl } from '../src/config/secrets';

export async function seedAcademicDataset() {
  console.log('================================================================');
  console.log('[Academic Production Seed] Starting safe, idempotent child data seeding...');
  console.log('================================================================');

  const databaseUrl = await getDatabaseUrl();
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // ----------------------------------------------------
    // 0. Verification of Pre-requisite Records
    // ----------------------------------------------------
    console.log('\n[Phase 0] Verifying target student, faculty, and enrolled courses in RDS...');

    const karthik = await prisma.student.findFirst({
      where: {
        OR: [
          { enrollmentNumber: 'STU001' },
          { user: { email: 'karthikc11105@gmail.com' } },
        ],
      },
      include: { user: true, department: true },
    });

    if (!karthik) {
      throw new Error('Target student Karthik Chakala (STU001 / karthikc11105@gmail.com) not found in database!');
    }
    console.log(`  ✓ Student verified: ${karthik.firstName} ${karthik.lastName} (${karthik.enrollmentNumber}) [ID: ${karthik.id}]`);

    // Verify Faculty
    const facDeepak = await prisma.faculty.findUnique({ where: { employeeId: 'FAC_CSE01' } });
    const facBhargav = await prisma.faculty.findUnique({ where: { employeeId: 'FAC_CSE02' } });
    const facShaik = await prisma.faculty.findUnique({ where: { employeeId: 'FAC_CSE03' } });

    if (!facDeepak || !facBhargav || !facShaik) {
      throw new Error('Required faculty records (FAC_CSE01, FAC_CSE02, FAC_CSE03) are missing!');
    }
    console.log(`  ✓ Faculty verified: Deepak Gannamaneni (${facDeepak.employeeId}), Bhargav Reddy (${facBhargav.employeeId}), Shaik Venkat (${facShaik.employeeId})`);

    // Verify Courses
    const courseCodes = ['CSE203', 'CSE204', 'CSE207', 'CSE208'];
    const courses = await prisma.course.findMany({
      where: { code: { in: courseCodes } },
    });

    if (courses.length < 4) {
      throw new Error(`Expected 4 enrolled courses (${courseCodes.join(', ')}), but found ${courses.length}!`);
    }

    const courseMap: Record<string, typeof courses[0]> = {};
    courses.forEach(c => { courseMap[c.code] = c; });
    console.log(`  ✓ Enrolled courses verified: ${courses.map(c => `${c.code} (${c.name})`).join(', ')}`);

    // ----------------------------------------------------
    // 1. Attendance Sessions for Karthik (19 Total Sessions)
    // ----------------------------------------------------
    console.log('\n[Phase 1] Upserting 19 Attendance Sessions for Karthik...');

    const attendancePlan = [
      // CSE203 (Operating Systems): 4 Present, 1 Absent = 80%
      { courseCode: 'CSE203', date: new Date('2026-08-18T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE203', date: new Date('2026-08-20T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE203', date: new Date('2026-08-22T00:00:00.000Z'), status: AttendanceStatus.ABSENT, remarks: 'Medical leave' },
      { courseCode: 'CSE203', date: new Date('2026-08-25T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE203', date: new Date('2026-08-27T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },

      // CSE204 (Computer Networks): 5 Present, 0 Absent = 100%
      { courseCode: 'CSE204', date: new Date('2026-08-17T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE204', date: new Date('2026-08-19T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE204', date: new Date('2026-08-21T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE204', date: new Date('2026-08-24T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE204', date: new Date('2026-08-26T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },

      // CSE207 (Software Engineering): 3 Present, 1 Absent = 75%
      { courseCode: 'CSE207', date: new Date('2026-08-18T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE207', date: new Date('2026-08-21T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE207', date: new Date('2026-08-25T00:00:00.000Z'), status: AttendanceStatus.ABSENT, remarks: 'Personal reason' },
      { courseCode: 'CSE207', date: new Date('2026-08-28T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },

      // CSE208 (Cloud Computing): 4 Present, 1 Absent = 80%
      { courseCode: 'CSE208', date: new Date('2026-08-17T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE208', date: new Date('2026-08-20T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE208', date: new Date('2026-08-24T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
      { courseCode: 'CSE208', date: new Date('2026-08-27T00:00:00.000Z'), status: AttendanceStatus.ABSENT, remarks: 'AWS Collegiate Workshop' },
      { courseCode: 'CSE208', date: new Date('2026-08-31T00:00:00.000Z'), status: AttendanceStatus.PRESENT, remarks: null },
    ];

    let attendanceUpsertCount = 0;
    for (const att of attendancePlan) {
      const course = courseMap[att.courseCode];
      await prisma.attendance.upsert({
        where: {
          studentId_courseId_date: {
            studentId: karthik.id,
            courseId: course.id,
            date: att.date,
          },
        },
        update: {
          status: att.status,
          remarks: att.remarks,
        },
        create: {
          studentId: karthik.id,
          courseId: course.id,
          date: att.date,
          status: att.status,
          remarks: att.remarks,
        },
      });
      attendanceUpsertCount++;
    }
    console.log(`  ✓ ${attendanceUpsertCount} Attendance records upserted successfully.`);

    // ----------------------------------------------------
    // 2. Assignments (3 Courses) & 1 Submission for Karthik
    // ----------------------------------------------------
    console.log('\n[Phase 2] Upserting Assignments & Submissions...');

    // 2a. Assignment for CSE203 (Deepak Gannamaneni) - Pending for Karthik
    const cse203 = courseMap['CSE203'];
    let assign1 = await prisma.assignment.findFirst({
      where: { courseId: cse203.id, title: 'Assignment 1 — CPU Scheduling Algorithms' },
    });
    if (!assign1) {
      assign1 = await prisma.assignment.create({
        data: {
          title: 'Assignment 1 — CPU Scheduling Algorithms',
          description: 'Implement FCFS, SJF, and Round Robin scheduling algorithms. Analyze turnaround times and CPU utilization metrics.',
          dueDate: new Date('2026-09-15T23:59:59.000Z'),
          points: 100,
          courseId: cse203.id,
          facultyId: facDeepak.id,
        },
      });
      console.log(`  ✓ Created Assignment 1 for CSE203 [ID: ${assign1.id}]`);
    } else {
      console.log(`  ✓ Found existing Assignment 1 for CSE203 [ID: ${assign1.id}]`);
    }

    // 2b. Assignment for CSE208 (Shaik Venkat) - Graded Submission for Karthik
    const cse208 = courseMap['CSE208'];
    let assign2 = await prisma.assignment.findFirst({
      where: { courseId: cse208.id, title: 'Assignment 1 — Multi-Tier AWS Infrastructure' },
    });
    if (!assign2) {
      assign2 = await prisma.assignment.create({
        data: {
          title: 'Assignment 1 — Multi-Tier AWS Infrastructure',
          description: 'Design and deploy a resilient multi-tier web architecture using AWS EC2, S3, RDS PostgreSQL, and API Gateway.',
          dueDate: new Date('2026-08-28T23:59:59.000Z'),
          points: 100,
          courseId: cse208.id,
          facultyId: facShaik.id,
        },
      });
      console.log(`  ✓ Created Assignment 1 for CSE208 [ID: ${assign2.id}]`);
    } else {
      console.log(`  ✓ Found existing Assignment 1 for CSE208 [ID: ${assign2.id}]`);
    }

    // Upsert Submission for Karthik on Assignment 2 (CSE208)
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: assign2.id,
          studentId: karthik.id,
        },
      },
      update: {
        submissionDate: new Date('2026-08-27T18:45:00.000Z'),
        fileUrl: 'https://cloudcampus-511225358997.s3.us-east-1.amazonaws.com/submissions/karthik_aws_infrastructure_report.pdf',
        fileName: 'karthik_aws_infrastructure_report.pdf',
        status: SubmissionStatus.GRADED,
        grade: 'A+',
        feedback: 'Exceptional architecture diagrams, comprehensive security analysis, and clean Secrets Manager integration.',
        gradedAt: new Date('2026-08-29T14:30:00.000Z'),
        gradedById: facShaik.id,
      },
      create: {
        assignmentId: assign2.id,
        studentId: karthik.id,
        submissionDate: new Date('2026-08-27T18:45:00.000Z'),
        fileUrl: 'https://cloudcampus-511225358997.s3.us-east-1.amazonaws.com/submissions/karthik_aws_infrastructure_report.pdf',
        fileName: 'karthik_aws_infrastructure_report.pdf',
        status: SubmissionStatus.GRADED,
        grade: 'A+',
        feedback: 'Exceptional architecture diagrams, comprehensive security analysis, and clean Secrets Manager integration.',
        gradedAt: new Date('2026-08-29T14:30:00.000Z'),
        gradedById: facShaik.id,
      },
    });
    console.log(`  ✓ Upserted Graded Submission for Karthik on ${assign2.title} [Status: ${submission.status}, Grade: ${submission.grade}]`);

    // 2c. Assignment for CSE207 (Bhargav Reddy Narra) - Pending for Karthik
    const cse207 = courseMap['CSE207'];
    let assign3 = await prisma.assignment.findFirst({
      where: { courseId: cse207.id, title: 'Assignment 1 — Agile Software Development' },
    });
    if (!assign3) {
      assign3 = await prisma.assignment.create({
        data: {
          title: 'Assignment 1 — Agile Software Development',
          description: 'Create user stories, sprint backlogs, and sprint burndown charts for a campus management software project.',
          dueDate: new Date('2026-09-20T23:59:59.000Z'),
          points: 50,
          courseId: cse207.id,
          facultyId: facBhargav.id,
        },
      });
      console.log(`  ✓ Created Assignment 1 for CSE207 [ID: ${assign3.id}]`);
    } else {
      console.log(`  ✓ Found existing Assignment 1 for CSE207 [ID: ${assign3.id}]`);
    }

    // ----------------------------------------------------
    // 3. Exam for CSE208 (Cloud Computing)
    // ----------------------------------------------------
    console.log('\n[Phase 3] Upserting Exam for CSE208 (Cloud Computing)...');

    let midtermExam = await prisma.exam.findFirst({
      where: { courseId: cse208.id, name: 'Midterm Examination' },
    });

    if (!midtermExam) {
      midtermExam = await prisma.exam.create({
        data: {
          courseId: cse208.id,
          name: 'Midterm Examination',
          examDate: new Date('2026-08-25T09:30:00.000Z'),
          startTime: '09:30 AM',
          endTime: '12:30 PM',
          location: 'Main Block - Examination Hall B',
          maxMarks: 100,
          status: ExamStatus.COMPLETED,
        },
      });
      console.log(`  ✓ Created Midterm Examination for CSE208 [ID: ${midtermExam.id}]`);
    } else {
      console.log(`  ✓ Found existing Midterm Examination for CSE208 [ID: ${midtermExam.id}]`);
    }

    // ----------------------------------------------------
    // 4. Published Result for Karthik on Midterm Exam
    // ----------------------------------------------------
    console.log('\n[Phase 4] Upserting Published Exam Result for Karthik...');

    const result = await prisma.result.upsert({
      where: {
        examId_studentId: {
          examId: midtermExam.id,
          studentId: karthik.id,
        },
      },
      update: {
        marksObtained: 92.5,
        grade: 'A',
        status: ResultStatus.PUBLISHED,
        remarks: 'Outstanding performance in cloud architecture, security boundaries, and relational database migrations.',
      },
      create: {
        examId: midtermExam.id,
        studentId: karthik.id,
        marksObtained: 92.5,
        grade: 'A',
        status: ResultStatus.PUBLISHED,
        remarks: 'Outstanding performance in cloud architecture, security boundaries, and relational database migrations.',
      },
    });
    console.log(`  ✓ Upserted Published Result: ${result.marksObtained}/100 | Grade: ${result.grade} | Status: ${result.status}`);

    // ----------------------------------------------------
    // 5. Verification & Summary Metrics
    // ----------------------------------------------------
    console.log('\n================================================================');
    console.log('[Academic Production Seed] DATABASE VERIFICATION SUMMARY');
    console.log('================================================================');

    // Attendance Verification
    const attendanceSummary: any[] = [];
    let totalPresentOverall = 0;
    let totalSessionsOverall = 0;

    for (const code of courseCodes) {
      const c = courseMap[code];
      const records = await prisma.attendance.findMany({
        where: { studentId: karthik.id, courseId: c.id },
      });
      const present = records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.LATE).length;
      const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
      const total = records.length;
      const pct = total > 0 ? ((present / total) * 100).toFixed(2) : '100.00';

      totalPresentOverall += present;
      totalSessionsOverall += total;

      attendanceSummary.push({
        courseCode: code,
        courseName: c.name,
        present,
        absent,
        total,
        percentage: `${pct}%`,
      });
    }

    const overallPct = totalSessionsOverall > 0 ? ((totalPresentOverall / totalSessionsOverall) * 100).toFixed(2) : '100.00';

    console.log('\nATTENDANCE SUMMARY:');
    console.table(attendanceSummary);
    console.log(`Overall Attendance: ${totalPresentOverall} / ${totalSessionsOverall} sessions = ${overallPct}%`);

    // Assignments Verification
    const allAssignments = await prisma.assignment.findMany({
      where: { courseId: { in: courses.map(c => c.id) } },
      include: {
        course: { select: { code: true, name: true } },
        faculty: { select: { employeeId: true, firstName: true, lastName: true } },
        submissions: { where: { studentId: karthik.id } },
      },
      orderBy: { course: { code: 'asc' } },
    });

    console.log('\nASSIGNMENTS SUMMARY:');
    allAssignments.forEach(a => {
      const sub = a.submissions[0];
      const subStatus = sub ? `${sub.status} (Grade: ${sub.grade || 'Pending'})` : 'PENDING (Not Submitted)';
      console.log(`  - [${a.course.code}] "${a.title}" | Due: ${a.dueDate.toISOString().slice(0, 10)} | Faculty: ${a.faculty.firstName} ${a.faculty.lastName} (${a.faculty.employeeId}) | Karthik Submission: ${subStatus}`);
    });

    // Exam & Result Verification
    const allExams = await prisma.exam.findMany({
      where: { courseId: { in: courses.map(c => c.id) } },
      include: {
        course: { select: { code: true, name: true } },
        results: { where: { studentId: karthik.id } },
      },
    });

    console.log('\nEXAM & RESULTS SUMMARY:');
    allExams.forEach(e => {
      const res = e.results[0];
      const resStatus = res ? `Marks: ${res.marksObtained}/${e.maxMarks} | Grade: ${res.grade} | Status: ${res.status}` : 'No result';
      console.log(`  - [${e.course.code}] Exam: "${e.name}" (${e.status}) on ${e.examDate.toISOString().slice(0, 10)} | Karthik Result: ${resStatus}`);
    });

    console.log('\n================================================================');
    console.log('[Academic Production Seed] IDEMPOTENT ACADEMIC SEEDING COMPLETED 100%');
    console.log('================================================================\n');

  } catch (error: any) {
    console.error('[Academic Production Seed] Fatal execution error:', error.message || error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedAcademicDataset()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedAcademicDataset;
