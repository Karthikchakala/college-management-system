const fs = require('fs');
const { runOnEc2 } = require('./ec2-exec');

async function syncPrismaToEc2() {
  const schemaContent = fs.readFileSync('c:/Users/karth/Downloads/CloudComputing/backend/prisma/schema.prisma', 'utf8');
  const base64 = Buffer.from(schemaContent).toString('base64');

  await runOnEc2([
    `echo "${base64}" | base64 -d > /home/ec2-user/college-management-system/backend/prisma/schema.prisma`,
    `cd /home/ec2-user/college-management-system/backend && npx prisma generate`
  ]);
  console.log('Prisma schema synced and generated on EC2.');
}

syncPrismaToEc2();
