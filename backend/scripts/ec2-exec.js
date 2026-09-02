const { SSMClient, SendCommandCommand, GetCommandInvocationCommand } = require('@aws-sdk/client-ssm');
const ssm = new SSMClient({ region: 'us-east-1' });

const INSTANCE_ID = 'i-03681025582d882c5';

async function runOnEc2(commands) {
  if (!Array.isArray(commands)) {
    commands = [commands];
  }

  console.log(`[EC2 SSM] Executing on ${INSTANCE_ID}:`);
  commands.forEach((c) => console.log(`  $ ${c}`));

  try {
    const sendRes = await ssm.send(
      new SendCommandCommand({
        InstanceIds: [INSTANCE_ID],
        DocumentName: 'AWS-RunShellScript',
        Parameters: {
          commands,
        },
      })
    );

    const commandId = sendRes.Command.CommandId;

    // Poll until terminal state
    let status = 'Pending';
    let invocation = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 2000));
      attempts++;

      try {
        invocation = await ssm.send(
          new GetCommandInvocationCommand({
            CommandId: commandId,
            InstanceId: INSTANCE_ID,
          })
        );
        status = invocation.Status;
        if (['Success', 'Failed', 'Cancelled', 'TimedOut'].includes(status)) {
          break;
        }
      } catch (err) {
        // Invocation may not be immediately ready
      }
    }

    if (invocation) {
      console.log(`\n[EC2 SSM] Status: ${invocation.Status}`);
      if (invocation.StandardOutputContent) {
        console.log('--- STDOUT ---');
        console.log(invocation.StandardOutputContent);
      }
      if (invocation.StandardErrorContent) {
        console.log('--- STDERR ---');
        console.log(invocation.StandardErrorContent);
      }
      return {
        status: invocation.Status,
        stdout: invocation.StandardOutputContent,
        stderr: invocation.StandardErrorContent,
      };
    } else {
      console.error('[EC2 SSM] Timed out waiting for command execution.');
      return { status: 'TimedOut', stdout: '', stderr: '' };
    }
  } catch (err) {
    console.error('[EC2 SSM] Error sending command:', err.message);
    throw err;
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const cmds = args.length > 0 ? args : ['whoami', 'pwd', 'node -v', 'npm -v', 'pm2 status'];
  runOnEc2(cmds);
}

module.exports = { runOnEc2 };
