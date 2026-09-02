const { CloudWatchLogsClient, FilterLogEventsCommand, DescribeLogStreamsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const logs = new CloudWatchLogsClient({ region: 'us-east-1' });

async function checkLambdaLogs(logGroupName) {
  console.log(`=== CLOUDWATCH LOGS FOR ${logGroupName} ===`);
  try {
    const streams = await logs.send(new DescribeLogStreamsCommand({
      logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
      limit: 3
    }));

    if (!streams.logStreams || streams.logStreams.length === 0) {
      console.log('No log streams found yet.');
      return;
    }

    for (const s of streams.logStreams) {
      console.log(`\nLog Stream: ${s.logStreamName}`);
      const events = await logs.send(new FilterLogEventsCommand({
        logGroupName,
        logStreamNames: [s.logStreamName],
        limit: 20
      }));
      events.events?.forEach(e => console.log(`[${new Date(e.timestamp).toISOString()}] ${e.message.trim()}`));
    }
  } catch (err) {
    console.error('Error fetching logs:', err.message);
  }
}

async function main() {
  await checkLambdaLogs('/aws/lambda/CloudCampus-Assignment-Notification');
}

main().catch(console.error);
