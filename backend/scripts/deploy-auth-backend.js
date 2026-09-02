const fs = require('fs');
const { runOnEc2 } = require('./ec2-exec');

async function deployAuthBackendToEc2() {
  const authCtrl = fs.readFileSync('c:/Users/karth/Downloads/CloudComputing/backend/dist/controllers/auth.controller.js', 'utf8');
  const authRoutes = fs.readFileSync('c:/Users/karth/Downloads/CloudComputing/backend/dist/routes/auth.routes.js', 'utf8');

  const authCtrlB64 = Buffer.from(authCtrl).toString('base64');
  const authRoutesB64 = Buffer.from(authRoutes).toString('base64');

  await runOnEc2([
    `echo "${authCtrlB64}" | base64 -d > /home/ec2-user/college-management-system/backend/dist/controllers/auth.controller.js`,
    `echo "${authRoutesB64}" | base64 -d > /home/ec2-user/college-management-system/backend/dist/routes/auth.routes.js`,
    `sudo -u ec2-user pm2 reload cloudcampus-backend`,
    `sleep 2`,
    `curl -s http://localhost:5000/health`
  ]);
  console.log('Backend auth controller & routes deployed to EC2.');
}

deployAuthBackendToEc2();
