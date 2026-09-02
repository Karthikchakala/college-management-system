const { runOnEc2 } = require('./ec2-exec');

async function seedRealisticStudentData() {
  const scriptContent = `
const { initDatabase } = require('./dist/config/db');

async function seed() {
  const prisma = await initDatabase();
  console.log('Connected to RDS PostgreSQL...');

  const emma = await prisma.student.findFirst({ where: { enrollmentNumber: 'STU002' }, include: { user: true } });
  const karthik = await prisma.student.findFirst({ where: { enrollmentNumber: 'STU001' }, include: { user: true } });
  const studentsToMark = [emma, karthik].filter(Boolean);

  for (const s of studentsToMark) {
    const notifs = [
      {
        userId: s.userId,
        title: 'New Assignment Published: Problem Set 1',
        message: 'Faculty Alice Smith has assigned Problem Set 1 for CS101. Due in 7 days.',
        type: 'ACADEMIC'
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

  console.log('=== NOTIFICATIONS SEED COMPLETED SUCCESSFULLY ===');
}

seed().then(() => process.exit(0)).catch(e => { console.error('Seed Error:', e); process.exit(1); });
`;

  await runOnEc2([
    `cat << 'EOF' > /home/ec2-user/college-management-system/backend/seed_notifs.js\n${scriptContent}\nEOF`,
    `cd /home/ec2-user/college-management-system/backend && node seed_notifs.js`,
    `rm -f /home/ec2-user/college-management-system/backend/seed_notifs.js`
  ]);
}

seedRealisticStudentData();
