import { PrismaClient, Role, UserStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getDatabaseUrl } from '../src/config/secrets';

async function main() {
  console.log('[Production Seed] Starting safe, non-destructive production data initialization...');

  // Dynamically resolve database URL (from AWS Secrets Manager in production, or .env in development)
  const databaseUrl = await getDatabaseUrl();
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    // 1. Initial Departments (Upsert using unique 'code')
    const departmentsData = [
      { name: 'Computer Science & Engineering', code: 'CSE' },
      { name: 'Electronics & Communication Engineering', code: 'ECE' },
      { name: 'Mechanical Engineering', code: 'ME' },
    ];

    const departmentMap: Record<string, string> = {};
    for (const d of departmentsData) {
      const dept = await prisma.department.upsert({
        where: { code: d.code },
        update: {}, // Never overwrite existing department data
        create: {
          name: d.name,
          code: d.code,
          status: UserStatus.ACTIVE,
        },
      });
      departmentMap[d.code] = dept.id;
      console.log(`[Production Seed] Department verified/created: ${d.code} (${dept.id})`);
    }

    // Default password hash for initial user record creation (cognitoSub remains null until user logs in with Cognito)
    const defaultPasswordHash = await bcrypt.hash('password123', 10);

    // 2. Initial Users (Upsert using unique 'email')
    const initialUsersData = [
      { email: 'admin@campus.edu', role: Role.ADMIN },
      { email: 'admin@campus.local', role: Role.ADMIN },
      { email: 'faculty@campus.edu', role: Role.FACULTY },
      { email: 'faculty@campus.local', role: Role.FACULTY },
      { email: 'student@campus.edu', role: Role.STUDENT },
      { email: 'student@campus.local', role: Role.STUDENT },
    ];

    const userMap: Record<string, string> = {};
    for (const u of initialUsersData) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {}, // Never overwrite existing user passwords, roles, or linked cognitoSub
        create: {
          email: u.email,
          role: u.role,
          passwordHash: defaultPasswordHash,
          cognitoSub: null, // Stable Cognito sub will be linked upon verified Cognito login
          status: UserStatus.ACTIVE,
        },
      });
      userMap[u.email] = user.id;
      console.log(`[Production Seed] User verified/created: ${u.email} (${u.role})`);
    }

    // 3. Faculty Profiles (Upsert using unique 'employeeId')
    const facultyProfilesData = [
      {
        email: 'faculty@campus.edu',
        employeeId: 'FAC001',
        firstName: 'John',
        lastName: 'Doe',
        designation: 'Professor',
        departmentCode: 'CSE',
      },
      {
        email: 'faculty@campus.local',
        employeeId: 'FAC002',
        firstName: 'Alice',
        lastName: 'Smith',
        designation: 'Associate Professor',
        departmentCode: 'CSE',
      },
    ];

    const facultyMap: Record<string, string> = {};
    for (const f of facultyProfilesData) {
      const userId = userMap[f.email];
      const deptId = departmentMap[f.departmentCode];
      if (userId && deptId) {
        const faculty = await prisma.faculty.upsert({
          where: { employeeId: f.employeeId },
          update: {}, // Preserve existing faculty profile
          create: {
            userId,
            employeeId: f.employeeId,
            firstName: f.firstName,
            lastName: f.lastName,
            designation: f.designation,
            departmentId: deptId,
            status: UserStatus.ACTIVE,
          },
        });
        facultyMap[f.employeeId] = faculty.id;
        console.log(`[Production Seed] Faculty profile verified/created: ${f.employeeId} (${f.firstName} ${f.lastName})`);
      }
    }

    // 4. Student Profiles (Upsert using unique 'enrollmentNumber')
    const studentProfilesData = [
      {
        email: 'student@campus.edu',
        enrollmentNumber: 'STU001',
        firstName: 'Karthik',
        lastName: 'Chakala',
        departmentCode: 'CSE',
        dateOfBirth: new Date('2004-05-15'),
      },
      {
        email: 'student@campus.local',
        enrollmentNumber: 'STU002',
        firstName: 'Emma',
        lastName: 'Davis',
        departmentCode: 'CSE',
        dateOfBirth: new Date('2003-08-22'),
      },
    ];

    const studentMap: Record<string, string> = {};
    for (const s of studentProfilesData) {
      const userId = userMap[s.email];
      const deptId = departmentMap[s.departmentCode];
      if (userId && deptId) {
        const student = await prisma.student.upsert({
          where: { enrollmentNumber: s.enrollmentNumber },
          update: {}, // Preserve existing student profile
          create: {
            userId,
            enrollmentNumber: s.enrollmentNumber,
            firstName: s.firstName,
            lastName: s.lastName,
            departmentId: deptId,
            dateOfBirth: s.dateOfBirth,
            status: UserStatus.ACTIVE,
          },
        });
        studentMap[s.enrollmentNumber] = student.id;
        console.log(`[Production Seed] Student profile verified/created: ${s.enrollmentNumber} (${s.firstName} ${s.lastName})`);
      }
    }

    // 5. Foundational Courses (Upsert using unique 'code')
    const foundationalCourses = [
      {
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Basics of programming algorithms, data structures, and problem solving',
        credits: 3,
        departmentCode: 'CSE',
        facultyEmployeeId: 'FAC001',
      },
      {
        code: 'CS301',
        name: 'Database Management Systems',
        description: 'Relational database systems, SQL query design, and transactional integrity',
        credits: 4,
        departmentCode: 'CSE',
        facultyEmployeeId: 'FAC001',
      },
      {
        code: 'EC201',
        name: 'Digital Electronics',
        description: 'Digital logic circuits, sequential elements, and hardware design',
        credits: 3,
        departmentCode: 'ECE',
        facultyEmployeeId: 'FAC002',
      },
      {
        code: 'ME101',
        name: 'Engineering Drawing',
        description: 'Geometric engineering constructions and orthographic projections',
        credits: 2,
        departmentCode: 'ME',
        facultyEmployeeId: null,
      },
    ];

    const courseMap: Record<string, string> = {};
    for (const c of foundationalCourses) {
      const deptId = departmentMap[c.departmentCode];
      const facultyId = c.facultyEmployeeId ? facultyMap[c.facultyEmployeeId] || null : null;
      if (deptId) {
        const course = await prisma.course.upsert({
          where: { code: c.code },
          update: {}, // Preserve existing course configuration
          create: {
            code: c.code,
            name: c.name,
            description: c.description,
            credits: c.credits,
            departmentId: deptId,
            facultyId,
            status: UserStatus.ACTIVE,
          },
        });
        courseMap[c.code] = course.id;
        console.log(`[Production Seed] Course verified/created: ${c.code} (${c.name})`);
      }
    }

    // 6. Sample Course Enrollments (Upsert using composite key 'studentId_courseId')
    const initialEnrollments = [
      { studentEnrollmentNumber: 'STU001', courseCode: 'CS101' },
      { studentEnrollmentNumber: 'STU001', courseCode: 'CS301' },
      { studentEnrollmentNumber: 'STU002', courseCode: 'CS101' },
    ];

    for (const e of initialEnrollments) {
      const studentId = studentMap[e.studentEnrollmentNumber];
      const courseId = courseMap[e.courseCode];
      if (studentId && courseId) {
        await prisma.enrollment.upsert({
          where: {
            studentId_courseId: {
              studentId,
              courseId,
            },
          },
          update: {}, // Never overwrite or drop existing enrollment
          create: {
            studentId,
            courseId,
            status: UserStatus.ACTIVE,
          },
        });
        console.log(`[Production Seed] Enrollment verified/created: Student ${e.studentEnrollmentNumber} -> Course ${e.courseCode}`);
      }
    }

    console.log('[Production Seed] Non-destructive production initialization completed successfully.');
  } catch (error: any) {
    console.error('[Production Seed] Error during initialization:', error.message || error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default main;
