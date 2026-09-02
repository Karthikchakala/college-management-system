const { runOnEc2 } = require('./ec2-exec');

async function checkPm2Error() {
  await runOnEc2([
    `sudo -u ec2-user pm2 list`,
    `cat /var/log/cloudcampus/backend-error.log | tail -n 25`,
    `curl -i http://localhost:5000/health`
  ]);
}

checkPm2Error();
