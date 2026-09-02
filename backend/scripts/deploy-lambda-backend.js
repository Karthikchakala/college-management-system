const fs = require('fs');
const { runOnEc2 } = require('./ec2-exec');

async function deployBackendToEc2() {
  const facCtrl = fs.readFileSync('c:/Users/karth/Downloads/CloudComputing/backend/dist/controllers/faculty.controller.js', 'utf8');
  const lambdaSvc = fs.readFileSync('c:/Users/karth/Downloads/CloudComputing/backend/dist/services/lambda.service.js', 'utf8');

  const facCtrlB64 = Buffer.from(facCtrl).toString('base64');
  const lambdaSvcB64 = Buffer.from(lambdaSvc).toString('base64');

  await runOnEc2([
    `echo "${lambdaSvcB64}" | base64 -d > /home/ec2-user/college-management-system/backend/dist/services/lambda.service.js`,
    `echo "${facCtrlB64}" | base64 -d > /home/ec2-user/college-management-system/backend/dist/controllers/faculty.controller.js`,
    `sudo -u ec2-user pm2 reload cloudcampus-backend`,
    `sleep 2`,
    `curl -s http://localhost:5000/health`
  ]);
  console.log('Backend faculty controller & lambda service deployed to EC2.');
}

deployBackendToEc2();
