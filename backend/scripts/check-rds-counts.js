const { runOnEc2 } = require('./ec2-exec');

async function checkRdsCounts() {
  const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function countAll() {
  const users = await prisma.user.count();
  const students = await prisma.student.count();
  const faculty = await prisma.faculty.count();
  const departments = await prisma.department.count();
  const courses = await prisma.course.count();
  const enrollments = await prisma.enrollment.count();
  const auditLogs = await prisma.auditLog.count();
  const announcements = await prisma.announcement.count();
  const events = await prisma.event.count();
  const attendance = await prisma.attendance.count();
  const assignments = await prisma.assignment.count();
  const submissions = await prisma.submission.count();
  const results = await prisma.result.count();
  console.log('=== RDS DATABASE COUNTS ===');
  console.log(JSON.stringify({ users, students, faculty, departments, courses, enrollments, auditLogs, announcements, events, attendance, assignments, submissions, results }, null, 2));
}
countAll().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); });
`;

  await runOnEc2([
    `cat << 'EOF' > /home/ec2-user/count_records.js\n${scriptContent}\nEOF`,
    `cd /home/ec2-user/college-management-system/backend && node /home/ec2-user/count_records.js`,
    `rm -f /home/ec2-user/count_records.js`
  ]);
}

checkRdsCounts();
