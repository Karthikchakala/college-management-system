const { runOnEc2 } = require('./ec2-exec');

async function checkPm2Logs() {
  await runOnEc2([
    `sudo -u ec2-user pm2 status`,
    `sudo -u ec2-user pm2 logs --lines 40 --nostream`
  ]);
}

checkPm2Logs();
