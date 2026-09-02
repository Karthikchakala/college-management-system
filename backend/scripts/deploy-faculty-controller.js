const fs = require('fs');
const { runOnEc2 } = require('./ec2-exec');

async function deployFacultyController() {
  const localPath = 'c:/Users/karth/Downloads/CloudComputing/backend/dist/controllers/faculty.controller.js';
  const fileContent = fs.readFileSync(localPath, 'utf8');
  const base64Content = Buffer.from(fileContent).toString('base64');

  console.log('Deploying compiled faculty.controller.js to EC2...');
  await runOnEc2([
    `echo "${base64Content}" | base64 -d > /home/ec2-user/college-management-system/backend/dist/controllers/faculty.controller.js`,
    `sudo -u ec2-user pm2 reload cloudcampus-backend`,
    `sleep 2`,
    `curl -s http://localhost:5000/health`,
  ]);
  console.log('Deployment complete and PM2 reloaded.');
}

deployFacultyController();
