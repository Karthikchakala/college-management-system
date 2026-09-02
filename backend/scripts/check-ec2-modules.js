const { runOnEc2 } = require('./ec2-exec');

async function checkEc2Modules() {
  await runOnEc2([
    `ls -ld /home/ec2-user/college-management-system/backend/node_modules/@aws-sdk/client-lambda`,
    `cd /home/ec2-user/college-management-system/backend && npm install @aws-sdk/client-lambda`,
    `sudo -u ec2-user pm2 reload cloudcampus-backend`,
    `sleep 3`,
    `curl -s http://localhost:5000/health`
  ]);
}

checkEc2Modules();
