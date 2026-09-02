const { runOnEc2 } = require('./ec2-exec');

async function checkPm2() {
  await runOnEc2([
    `sudo -u ec2-user pm2 restart all`,
    `sleep 3`,
    `sudo -u ec2-user pm2 list`,
    `curl -s http://localhost:5000/health`,
    `sudo -u ec2-user pm2 logs --lines 20 --nostream`
  ]);
}

checkPm2();
