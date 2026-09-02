const { runOnEc2 } = require('./ec2-exec');

async function inspectStudentData() {
  const scriptContent = `
const { initDatabase } = require('./dist/config/db');

async function check() {
  const prisma = await initDatabase();

  const users = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    include: {
      student: {
        include: {
          department: true,
          enrollments: { include: { course: true } },
          attendance: true,
          submissions: true,
          results: true,
        }
      }
    }
  });

  const faculty = await prisma.faculty.findMany({
    include: { courses: true, assignments: true }
  });

  const courses = await prisma.course.findMany({
    include: { assignments: true, exams: true }
  });

  const events = await prisma.event.findMany();
  const announcements = await prisma.announcement.findMany();
  const notifications = await prisma.notification.findMany();

  console.log('=== RDS STUDENTS ===');
  console.log(JSON.stringify(users.map(u => ({
    email: u.email,
    id: u.id,
    studentId: u.student?.id,
    name: u.student ? (u.student.firstName + ' ' + u.student.lastName) : 'N/A',
    enrollmentNumber: u.student?.enrollmentNumber,
    enrollmentsCount: u.student?.enrollments?.length || 0,
    enrolledCourses: u.student?.enrollments?.map(e => e.course.code) || [],
    attendanceCount: u.student?.attendance?.length || 0,
    submissionsCount: u.student?.submissions?.length || 0,
    resultsCount: u.student?.results?.length || 0,
  })), null, 2));

  console.log('=== RDS COURSES & ASSIGNMENTS & EXAMS ===');
  console.log(JSON.stringify(courses.map(c => ({
    code: c.code,
    id: c.id,
    assignmentsCount: c.assignments.length,
    examsCount: c.exams.length
  })), null, 2));

  console.log('=== RDS EVENTS COUNT ===', events.length);
  console.log('=== RDS ANNOUNCEMENTS COUNT ===', announcements.length);
  console.log('=== RDS NOTIFICATIONS COUNT ===', notifications.length);
}

check().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
`;

  await runOnEc2([
    `cat << 'EOF' > /home/ec2-user/college-management-system/backend/inspect_students.js\n${scriptContent}\nEOF`,
    `cd /home/ec2-user/college-management-system/backend && node inspect_students.js`,
    `rm -f /home/ec2-user/college-management-system/backend/inspect_students.js`
  ]);
}

inspectStudentData();
