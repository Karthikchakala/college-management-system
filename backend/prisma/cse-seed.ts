import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getDatabaseUrl } from '../src/config/secrets';

export async function seedCseDataset() {
  console.log('================================================================');
  console.log('[CSE Production Seed] Starting safe, idempotent CSE data seeding...');
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
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // ----------------------------------------------------
    // 1. Department: Computer Science & Engineering (CSE)
    // ----------------------------------------------------
    console.log('\n[1/5] Verifying CSE Department...');
    const cseDept = await prisma.department.upsert({
      where: { code: 'CSE' },
      update: {}, // Preserve existing department details
      create: {
        name: 'Computer Science & Engineering',
        code: 'CSE',
        status: UserStatus.ACTIVE,
      },
    });
    console.log(`  ✓ Department verified: ${cseDept.name} [Code: ${cseDept.code}, ID: ${cseDept.id}]`);

    // ----------------------------------------------------
    // 2. Faculty Members (4 Members)
    // ----------------------------------------------------
    console.log('\n[2/5] Upserting 4 CSE Faculty members...');
    const facultyData = [
      {
        email: 'deepakgannamaneni@gmail.com',
        firstName: 'Deepak',
        lastName: 'Gannamaneni',
        employeeId: 'FAC_CSE01',
        designation: 'Professor',
      },
      {
        email: 'bhargavreddynarra2605@gmail.com',
        firstName: 'Bhargav Reddy',
        lastName: 'Narra',
        employeeId: 'FAC_CSE02',
        designation: 'Associate Professor',
      },
      {
        email: 'shaikvenkat17@gmail.com',
        firstName: 'Shaik',
        lastName: 'Venkat',
        employeeId: 'FAC_CSE03',
        designation: 'Assistant Professor',
      },
      {
        email: 'ur4207546@gmail.com',
        firstName: 'UR',
        lastName: 'Faculty',
        employeeId: 'FAC_CSE04',
        designation: 'Assistant Professor',
      },
    ];

    const facultyMap: Record<string, string> = {}; // employeeId -> faculty.id

    for (const f of facultyData) {
      // 2a. Upsert Faculty User record (never overwrite existing passwords or cognitoSub)
      const user = await prisma.user.upsert({
        where: { email: f.email },
        update: {
          role: Role.FACULTY,
          status: UserStatus.ACTIVE,
        },
        create: {
          email: f.email,
          role: Role.FACULTY,
          passwordHash: defaultPasswordHash,
          status: UserStatus.ACTIVE,
        },
      });

      // 2b. Upsert Faculty profile record
      const faculty = await prisma.faculty.upsert({
        where: { employeeId: f.employeeId },
        update: {
          firstName: f.firstName,
          lastName: f.lastName,
          designation: f.designation,
          departmentId: cseDept.id,
        },
        create: {
          userId: user.id,
          employeeId: f.employeeId,
          firstName: f.firstName,
          lastName: f.lastName,
          designation: f.designation,
          departmentId: cseDept.id,
          status: UserStatus.ACTIVE,
        },
      });

      facultyMap[f.employeeId] = faculty.id;
      console.log(`  ✓ Faculty verified: ${f.firstName} ${f.lastName} (${f.employeeId}) -> User: ${f.email}`);
    }

    // ----------------------------------------------------
    // 3. Students (3 Students, preserving Karthik Chakala)
    // ----------------------------------------------------
    console.log('\n[3/5] Upserting 3 CSE Students (preserving existing accounts)...');
    const studentsData = [
      {
        email: 'manoj23iiitk27@gmail.com',
        firstName: 'Manoj',
        lastName: 'Kumar',
        enrollmentNumber: 'CSE2026S001',
        dateOfBirth: new Date('2004-04-12'),
      },
      {
        email: 'boggavarapupraveen2036@gmail.com',
        firstName: 'Praveen',
        lastName: 'Boggavarapu',
        enrollmentNumber: 'CSE2026S002',
        dateOfBirth: new Date('2004-08-25'),
      },
      {
        email: 'karthikc11105@gmail.com',
        firstName: 'Karthik',
        lastName: 'Chakala',
        enrollmentNumber: 'STU001',
        dateOfBirth: new Date('2004-05-15'),
      },
    ];

    const studentMap: Record<string, string> = {}; // enrollmentNumber -> student.id

    for (const s of studentsData) {
      // 3a. Upsert Student User (never overwrite existing passwords or cognitoSub)
      const user = await prisma.user.upsert({
        where: { email: s.email },
        update: {
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
        },
        create: {
          email: s.email,
          role: Role.STUDENT,
          passwordHash: defaultPasswordHash,
          status: UserStatus.ACTIVE,
        },
      });

      // 3b. Upsert Student profile
      const student = await prisma.student.upsert({
        where: { enrollmentNumber: s.enrollmentNumber },
        update: {
          firstName: s.firstName,
          lastName: s.lastName,
          departmentId: cseDept.id,
        },
        create: {
          userId: user.id,
          enrollmentNumber: s.enrollmentNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          departmentId: cseDept.id,
          dateOfBirth: s.dateOfBirth,
          status: UserStatus.ACTIVE,
        },
      });

      studentMap[s.enrollmentNumber] = student.id;
      console.log(`  ✓ Student verified: ${s.firstName} ${s.lastName} (${s.enrollmentNumber}) -> User: ${s.email}`);
    }

    // ----------------------------------------------------
    // 4. 8 CSE Courses & Faculty Assignments
    // ----------------------------------------------------
    console.log('\n[4/5] Upserting 8 CSE Courses and assigning to faculty...');
    const coursesData = [
      {
        code: 'CSE201',
        name: 'Data Structures',
        description: 'Linear and non-linear data structures, trees, graphs, hashing, and asymptotic analysis.',
        credits: 4,
        facultyEmployeeId: 'FAC_CSE01', // Deepak Gannamaneni
      },
      {
        code: 'CSE202',
        name: 'Database Management Systems',
        description: 'Relational data models, SQL queries, normalization, ACID transactions, and query optimization.',
        credits: 4,
        facultyEmployeeId: 'FAC_CSE02', // Bhargav Reddy Narra
      },
      {
        code: 'CSE203',
        name: 'Operating Systems',
        description: 'Process synchronization, CPU scheduling, virtual memory management, and file systems.',
        credits: 4,
        facultyEmployeeId: 'FAC_CSE01', // Deepak Gannamaneni
      },
      {
        code: 'CSE204',
        name: 'Computer Networks',
        description: 'OSI and TCP/IP protocol architectures, routing algorithms, transport layer protocols, and network security.',
        credits: 4,
        facultyEmployeeId: 'FAC_CSE03', // Shaik Venkat
      },
      {
        code: 'CSE205',
        name: 'Machine Learning',
        description: 'Supervised and unsupervised learning, neural networks, decision trees, regression, and model evaluation.',
        credits: 3,
        facultyEmployeeId: 'FAC_CSE04', // UR Faculty
      },
      {
        code: 'CSE206',
        name: 'Web Technologies',
        description: 'Modern full-stack web architectures, REST APIs, frontend frameworks, and cloud deployment.',
        credits: 3,
        facultyEmployeeId: 'FAC_CSE04', // UR Faculty
      },
      {
        code: 'CSE207',
        name: 'Software Engineering',
        description: 'Software lifecycle models, Agile methodologies, architectural patterns, design principles, and CI/CD.',
        credits: 3,
        facultyEmployeeId: 'FAC_CSE02', // Bhargav Reddy Narra
      },
      {
        code: 'CSE208',
        name: 'Cloud Computing',
        description: 'Cloud architecture principles, virtualization, AWS core services (EC2, S3, RDS, Lambda), and serverless design.',
        credits: 3,
        facultyEmployeeId: 'FAC_CSE03', // Shaik Venkat
      },
    ];

    const courseMap: Record<string, string> = {}; // code -> course.id

    for (const c of coursesData) {
      const facultyId = facultyMap[c.facultyEmployeeId] || null;

      const course = await prisma.course.upsert({
        where: { code: c.code },
        update: {
          name: c.name,
          description: c.description,
          credits: c.credits,
          departmentId: cseDept.id,
          facultyId,
        },
        create: {
          code: c.code,
          name: c.name,
          description: c.description,
          credits: c.credits,
          departmentId: cseDept.id,
          facultyId,
          status: UserStatus.ACTIVE,
        },
      });

      courseMap[c.code] = course.id;
      console.log(`  ✓ Course verified: ${c.code} (${c.name}) [${c.credits} Credits] -> Assigned to Faculty ${c.facultyEmployeeId}`);
    }

    // ----------------------------------------------------
    // 5. Student Course Enrollments
    // ----------------------------------------------------
    console.log('\n[5/5] Upserting Student Course Enrollments (preserving existing)...');
    const enrollmentMappings = [
      // Manoj (CSE2026S001): CSE201, CSE202, CSE203, CSE204
      { studentEnrollment: 'CSE2026S001', courseCode: 'CSE201' },
      { studentEnrollment: 'CSE2026S001', courseCode: 'CSE202' },
      { studentEnrollment: 'CSE2026S001', courseCode: 'CSE203' },
      { studentEnrollment: 'CSE2026S001', courseCode: 'CSE204' },

      // Boggavarapu Praveen (CSE2026S002): CSE201, CSE202, CSE205, CSE206
      { studentEnrollment: 'CSE2026S002', courseCode: 'CSE201' },
      { studentEnrollment: 'CSE2026S002', courseCode: 'CSE202' },
      { studentEnrollment: 'CSE2026S002', courseCode: 'CSE205' },
      { studentEnrollment: 'CSE2026S002', courseCode: 'CSE206' },

      // Karthik Chakala (STU001): CSE203, CSE204, CSE207, CSE208
      { studentEnrollment: 'STU001', courseCode: 'CSE203' },
      { studentEnrollment: 'STU001', courseCode: 'CSE204' },
      { studentEnrollment: 'STU001', courseCode: 'CSE207' },
      { studentEnrollment: 'STU001', courseCode: 'CSE208' },
    ];

    for (const em of enrollmentMappings) {
      const studentId = studentMap[em.studentEnrollment];
      const courseId = courseMap[em.courseCode];

      if (studentId && courseId) {
        await prisma.enrollment.upsert({
          where: {
            studentId_courseId: {
              studentId,
              courseId,
            },
          },
          update: {
            status: UserStatus.ACTIVE,
          },
          create: {
            studentId,
            courseId,
            status: UserStatus.ACTIVE,
          },
        });
        console.log(`  ✓ Enrolled: Student ${em.studentEnrollment} -> Course ${em.courseCode}`);
      }
    }

    // ----------------------------------------------------
    // 6. Summary Verification Queries
    // ----------------------------------------------------
    console.log('\n================================================================');
    console.log('[CSE Production Seed] Fetching Database Verification Summary...');
    console.log('================================================================');

    const totalDepartments = await prisma.department.count();
    const totalStudents = await prisma.student.count();
    const totalFaculty = await prisma.faculty.count();
    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();

    const allStudents = await prisma.student.findMany({
      include: {
        user: { select: { email: true } },
        department: { select: { code: true } },
      },
      orderBy: { enrollmentNumber: 'asc' },
    });

    const allFaculty = await prisma.faculty.findMany({
      include: {
        user: { select: { email: true } },
        department: { select: { code: true } },
        courses: { select: { code: true, name: true } },
      },
      orderBy: { employeeId: 'asc' },
    });

    const allCourses = await prisma.course.findMany({
      include: {
        faculty: { select: { employeeId: true, firstName: true, lastName: true } },
        department: { select: { code: true } },
      },
      orderBy: { code: 'asc' },
    });

    const allEnrollments = await prisma.enrollment.findMany({
      include: {
        student: { select: { enrollmentNumber: true, firstName: true, lastName: true } },
        course: { select: { code: true, name: true } },
      },
      orderBy: [
        { student: { enrollmentNumber: 'asc' } },
        { course: { code: 'asc' } },
      ],
    });

    console.log(`\nFinal Database Counts:`);
    console.log(`  • Departments: ${totalDepartments}`);
    console.log(`  • Students:    ${totalStudents}`);
    console.log(`  • Faculty:     ${totalFaculty}`);
    console.log(`  • Courses:     ${totalCourses}`);
    console.log(`  • Enrollments: ${totalEnrollments}`);

    console.log(`\nStudents in Database:`);
    allStudents.forEach(s => {
      console.log(`  - ${s.firstName} ${s.lastName} | Enrollment: ${s.enrollmentNumber} | Email: ${s.user.email} | Dept: ${s.department.code}`);
    });

    console.log(`\nFaculty in Database:`);
    allFaculty.forEach(f => {
      const courseCodes = f.courses.map(c => c.code).join(', ') || 'None';
      console.log(`  - ${f.firstName} ${f.lastName} | ID: ${f.employeeId} | ${f.designation} | Email: ${f.user.email} | Courses: [${courseCodes}]`);
    });

    console.log(`\nCourses in Database:`);
    allCourses.forEach(c => {
      const instructor = c.faculty ? `${c.faculty.firstName} ${c.faculty.lastName} (${c.faculty.employeeId})` : 'Unassigned';
      console.log(`  - ${c.code}: ${c.name} (${c.credits} cr) | Dept: ${c.department.code} | Faculty: ${instructor}`);
    });

    console.log(`\nActive Enrollments:`);
    allEnrollments.forEach(e => {
      console.log(`  - Student ${e.student.enrollmentNumber} (${e.student.firstName} ${e.student.lastName}) -> ${e.course.code} (${e.course.name})`);
    });

    console.log('\n================================================================');
    console.log('[CSE Production Seed] IDEMPOTENT INITIALIZATION COMPLETED 100%');
    console.log('================================================================\n');

  } catch (error: any) {
    console.error('[CSE Production Seed] Fatal execution error:', error.message || error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  seedCseDataset()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedCseDataset;
