const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const faculty = await prisma.faculty.findFirst({
    where: { user: { email: 'deepakgannamaneni@gmail.com' } },
    include: { courses: { include: { enrollments: { include: { student: { include: { user: true } } } } } }, user: true }
  });

  console.log('--- FACULTY DETAILS ---');
  console.log('Faculty ID:', faculty.id);
  console.log('User ID:', faculty.userId);
  console.log('Name:', faculty.firstName, faculty.lastName);
  console.log('Email:', faculty.user.email);
  console.log('Assigned Courses:');
  faculty.courses.forEach(c => {
    console.log(`  Course: ${c.code} - ${c.name} (ID: ${c.id})`);
    console.log(`  Enrolled Students (${c.enrollments.length}):`);
    c.enrollments.forEach(e => {
      console.log(`    - Student: ${e.student.firstName} ${e.student.lastName} (${e.student.user.email}) [ID: ${e.student.id}]`);
    });
  });

  const student = await prisma.student.findFirst({
    where: { user: { email: 'karthikc11105@gmail.com' } },
    include: { enrollments: { include: { course: { include: { faculty: { include: { user: true } } } } } }, user: true }
  });

  console.log('\n--- STUDENT DETAILS ---');
  console.log('Student ID:', student.id);
  console.log('User ID:', student.userId);
  console.log('Name:', student.firstName, student.lastName);
  console.log('Email:', student.user.email);
  console.log('Enrolled Courses:');
  student.enrollments.forEach(e => {
    console.log(`  Course: ${e.course.code} - ${e.course.name} | Faculty: ${e.course.faculty?.firstName} ${e.course.faculty?.lastName} (${e.course.faculty?.user?.email})`);
  });
}

check().catch(console.error).finally(() => prisma.$disconnect());
