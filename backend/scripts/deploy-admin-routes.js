const fs = require('fs');
const { runOnEc2 } = require('./ec2-exec');

async function deployAdminRoutes() {
  const routes = fs.readFileSync('c:/Users/karth/Downloads/CloudComputing/backend/dist/routes/admin.routes.js', 'utf8');
  const b64 = Buffer.from(routes).toString('base64');

  await runOnEc2([
    `echo "${b64}" | base64 -d > /home/ec2-user/college-management-system/backend/dist/routes/admin.routes.js`,
    `sudo -u ec2-user pm2 reload cloudcampus-backend`,
    `sleep 2`,
    `curl -s http://localhost:5000/health`
  ]);
  console.log('Updated admin.routes.js deployed to EC2.');
}

deployAdminRoutes();
