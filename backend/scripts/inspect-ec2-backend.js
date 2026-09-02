const { SSMClient, SendCommandCommand, GetCommandInvocationCommand } = require('@aws-sdk/client-ssm');
const ssm = new SSMClient({ region: 'us-east-1' });

const INSTANCE_ID = 'i-03681025582d882c5';

async function checkEc2() {
  console.log('Sending read-only status command to EC2 instance:', INSTANCE_ID);
  try {
    const sendRes = await ssm.send(new SendCommandCommand({
      InstanceIds: [INSTANCE_ID],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [
          'whoami',
          'ps aux | grep node',
          'pm2 status || true',
          'curl -I http://localhost:5000/health || true',
          'netstat -tlpn || ss -tlpn || true',
        ],
      },
    }));

    const commandId = sendRes.Command.CommandId;
    console.log('Command ID:', commandId);

    // Poll for completion
    let attempts = 0;
    while (attempts < 10) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;
      const inv = await ssm.send(new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: INSTANCE_ID,
      }));

      console.log(`[Attempt ${attempts}] Status:`, inv.Status);
      if (inv.Status === 'Success' || inv.Status === 'Failed') {
        console.log('=== STDOUT ===\n', inv.StandardOutputContent);
        console.log('=== STDERR ===\n', inv.StandardErrorContent);
        break;
      }
    }
  } catch (err) {
    console.error('SSM Inspection Error:', err.message);
  }
}

checkEc2();
