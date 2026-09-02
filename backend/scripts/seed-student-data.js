const { runOnEc2 } = require('./ec2-exec');

async function seedRealisticStudentData() {
  const scriptContent = `
const { initDatabase } = require('./dist/config/db');

async function seed() {
  const prisma = await initDatabase();
  console.log('Connected to RDS PostgreSQL...');

  // 1. Get Students
  const emma = await prisma.student.findFirst({ where: { enrollmentNumber: 'STU002' }, include: { user: true } });
  const karthik = await prisma.student.findFirst({ where: { enrollmentNumber: 'STU001' }, include: { user: true } });
  const studentsToMark = [emma, karthik].filter(Boolean);

  // 2. Get Courses
  const cs101 = await prisma.course.findFirst({ where: { code: 'CS101' } });
  const cse203 = await prisma.course.findFirst({ where: { code: 'CSE203' } });

  // 3. Create Exams & Results
  let exam1 = await prisma.exam.findFirst({ where: { courseId: cs101.id, name: 'Midterm Examination 2026' } });
  if (!exam1) {
    exam1 = await prisma.exam.create({
      data: {
        name: 'Midterm Examination 2026',
        courseId: cs101.id,
        examDate: new Date('2026-08-20'),
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        location: 'Examination Hall 101',
        maxMarks: 100,
        status: 'COMPLETED'
      }
    });
    console.log('Created Exam:', exam1.name);
  }

  for (const s of studentsToMark) {
    const existingResult = await prisma.result.findFirst({
      where: { studentId: s.id, examId: exam1.id }
    });
    if (!existingResult) {
      await prisma.result.create({
        data: {
          studentId: s.id,
          examId: exam1.id,
          marksObtained: s.enrollmentNumber === 'STU002' ? 91 : 94,
          grade: 'A+',
          status: 'PUBLISHED',
          remarks: 'Outstanding conceptual clarity and implementation.'
        }
      });
      console.log('Created Result for student:', s.enrollmentNumber);
    }
  }

  // 4. Create Campus Events
  const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (adminUser) {
    const eventsData = [
      {
        title: 'AWS Cloud Architecture Hackathon 2026',
        description: '48-hour hackathon on building serverless & containerized applications on Amazon Web Services.',
        eventDate: new Date(Date.now() + 5 * 24 * 3600 * 1000),
        time: '09:00 AM - 05:00 PM',
        location: 'Innovation Center & Tech Auditorium',
        organizerId: adminUser.id,
        status: 'ACTIVE'
      },
      {
        title: 'Campus Career & Tech Internship Fair',
        description: 'Annual recruitment and networking drive with leading cloud technology and software firms.',
        eventDate: new Date(Date.now() + 12 * 24 * 3600 * 1000),
        time: '10:00 AM - 04:00 PM',
        location: 'Main Campus Convention Center',
        organizerId: adminUser.id,
        status: 'ACTIVE'
      },
      {
        title: 'DevOps & Kubernetes Workshop',
        description: 'Hands-on training session on CI/CD pipelines, Docker, Kubernetes, and AWS EKS.',
        eventDate: new Date(Date.now() + 18 * 24 * 3600 * 1000),
        time: '02:00 PM - 06:00 PM',
        location: 'Advanced Computing Lab 3',
        organizerId: adminUser.id,
        status: 'ACTIVE'
      }
    ];

    for (const ev of eventsData) {
      const existing = await prisma.event.findFirst({ where: { title: ev.title } });
      if (!existing) {
        await prisma.event.create({ data: ev });
        console.log('Created Campus Event:', ev.title);
      }
    }
  }

  // 5. Create Notifications for Students
  for (const s of studentsToMark) {
    const notifs = [
      {
        userId: s.userId,
        title: 'New Assignment Published: Problem Set 1',
        message: 'Faculty Alice Smith has assigned Problem Set 1 for CS101. Due in 7 days.',
        type: 'ASSIGNMENT'
      },
      {
        userId: s.userId,
        title: 'Midterm Examination Results Released',
        message: 'Your results for Midterm Examination 2026 (CS101) have been published. Grade: A+.',
        type: 'EXAM'
      },
      {
        userId: s.userId,
        title: 'Event Registration Open: AWS Hackathon',
        message: 'Registration is now live for AWS Cloud Architecture Hackathon 2026.',
        type: 'EVENT'
      }
    ];

    for (const n of notifs) {
      const existing = await prisma.notification.findFirst({
        where: { userId: s.userId, title: n.title }
      });
      if (!existing) {
        await prisma.notification.create({ data: n });
      }
    }
    console.log('Created Notifications for user:', s.userId);
  }

  console.log('=== SEED COMPLETED SUCCESSFULLY ===');
}

seed().then(() => process.exit(0)).catch(e => { console.error('Seed Error:', e); process.exit(1); });
`;

  await runOnEc2([
    `cat << 'EOF' > /home/ec2-user/college-management-system/backend/seed_student_data.js\n${scriptContent}\nEOF`,
    `cd /home/ec2-user/college-management-system/backend && node seed_student_data.js`,
    `rm -f /home/ec2-user/college-management-system/backend/seed_student_data.js`
  ]);
}

seedRealisticStudentData();
