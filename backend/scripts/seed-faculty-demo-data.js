const { runOnEc2 } = require('./ec2-exec');

async function seedFacultyData() {
  const scriptContent = `
const { initDatabase } = require('./dist/config/db');

async function seed() {
  const prisma = await initDatabase();
  console.log('Connected to RDS PostgreSQL...');

  // 1. Get Faculty Alice Smith
  const facultyAlice = await prisma.faculty.findFirst({
    where: { employeeId: 'FAC002' },
    include: { courses: true, user: true }
  });
  console.log('Faculty Alice Smith ID:', facultyAlice?.id);

  // 2. Get EC201 Course
  const ec201 = await prisma.course.findFirst({ where: { code: 'EC201' } });
  console.log('EC201 Course ID:', ec201?.id);

  // 3. Get Students
  const emma = await prisma.student.findFirst({ where: { enrollmentNumber: 'STU002' } });
  const karthik = await prisma.student.findFirst({ where: { enrollmentNumber: 'STU001' } });

  // 4. Enroll Students in EC201
  if (ec201 && emma) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: emma.id, courseId: ec201.id } },
      update: { status: 'ACTIVE' },
      create: { studentId: emma.id, courseId: ec201.id, status: 'ACTIVE' }
    });
    console.log('Enrolled Emma in EC201');
  }

  if (ec201 && karthik) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: karthik.id, courseId: ec201.id } },
      update: { status: 'ACTIVE' },
      create: { studentId: karthik.id, courseId: ec201.id, status: 'ACTIVE' }
    });
    console.log('Enrolled Karthik in EC201');
  }

  // 5. Create Assignment in EC201
  let assignment = await prisma.assignment.findFirst({
    where: { courseId: ec201.id, title: 'Lab 1: Verilog Logic Simulation & Synthesis' }
  });
  if (!assignment) {
    assignment = await prisma.assignment.create({
      data: {
        title: 'Lab 1: Verilog Logic Simulation & Synthesis',
        description: 'Design a 4-bit synchronous binary counter using Verilog HDL and simulate testbench waveforms.',
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        points: 100,
        courseId: ec201.id,
        facultyId: facultyAlice.id,
      }
    });
    console.log('Created Assignment in EC201:', assignment.title);
  }

  // 6. Create Submission from Emma Davis
  const existingSub = await prisma.assignmentSubmission.findUnique({
    where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: emma.id } }
  });
  if (!existingSub) {
    await prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignment.id,
        studentId: emma.id,
        submissionDate: new Date(),
        fileUrl: 'https://cloudcampus-511225358997.s3.amazonaws.com/submissions/verilog_lab1_emma.pdf',
        fileName: 'verilog_lab1_emma.pdf',
        status: 'SUBMITTED'
      }
    });
    console.log('Created Submission for Emma Davis in EC201 Assignment');
  }

  // 7. Create Announcement in EC201 by Alice Smith
  const existingAnn = await prisma.announcement.findFirst({
    where: { courseId: ec201.id, title: 'EC201 Lab Hours & Simulation Tools Update' }
  });
  if (!existingAnn) {
    await prisma.announcement.create({
      data: {
        title: 'EC201 Lab Hours & Simulation Tools Update',
        content: 'Please install ModelSim / Vivado simulator prior to next Tuesday lab session.',
        type: 'ACADEMIC',
        courseId: ec201.id,
        authorId: facultyAlice.userId,
        status: 'ACTIVE'
      }
    });
    console.log('Created Announcement for EC201');
  }

  console.log('=== SEED FACULTY DATA COMPLETED SUCCESSFULLY ===');
}

seed().then(() => process.exit(0)).catch(e => { console.error('Seed Error:', e); process.exit(1); });
`;

  await runOnEc2([
    `cat << 'EOF' > /home/ec2-user/college-management-system/backend/seed_faculty_demo.js\n${scriptContent}\nEOF`,
    `cd /home/ec2-user/college-management-system/backend && node seed_faculty_demo.js`,
    `rm -f /home/ec2-user/college-management-system/backend/seed_faculty_demo.js`
  ]);
}

seedFacultyData();
