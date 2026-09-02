const { runOnEc2 } = require('./ec2-exec');

async function migrateProfileFields() {
  const sql = `
-- 1. Add Profile columns to "User"
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;

-- 2. Add Profile columns to "Student"
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "gender" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "year" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "semester" INTEGER;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;

-- 3. Add Profile columns to "Faculty"
ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "qualification" TEXT;
ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "specialization" TEXT;
ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "experience" INTEGER;
ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;
`;

  const scriptContent = `
const { initDatabase } = require('./dist/config/db');

async function runMigration() {
  const prisma = await initDatabase();
  console.log('Connected to RDS PostgreSQL...');

  const queries = [
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "name" TEXT;',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;',
    'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;',
    'ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "gender" TEXT;',
    'ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "year" INTEGER;',
    'ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "semester" INTEGER;',
    'ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;',
    'ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;',
    'ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "qualification" TEXT;',
    'ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "specialization" TEXT;',
    'ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "experience" INTEGER;',
    'ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "address" TEXT;',
    'ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;',
    'ALTER TABLE "Faculty" ADD COLUMN IF NOT EXISTS "avatarKey" TEXT;'
  ];

  for (const q of queries) {
    await prisma.$executeRawUnsafe(q);
    console.log('Executed:', q);
  }

  console.log('=== RDS PROFILE MIGRATION COMPLETED SUCCESSFULLY ===');
}

runMigration().then(() => process.exit(0)).catch(e => { console.error('Migration error:', e); process.exit(1); });
`;

  await runOnEc2([
    `cat << 'EOF' > /home/ec2-user/college-management-system/backend/migrate_profile.js\n${scriptContent}\nEOF`,
    `cd /home/ec2-user/college-management-system/backend && node migrate_profile.js`,
    `rm -f /home/ec2-user/college-management-system/backend/migrate_profile.js`
  ]);
}

migrateProfileFields();
