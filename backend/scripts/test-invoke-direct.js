const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

async function testDirect() {
  console.log('Invoking CloudCampus-Assignment-Notification with assignmentId: cf944cee-df8b-4dc9-b994-34b202c01f31...');
  const res = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Notification',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ assignmentId: 'cf944cee-df8b-4dc9-b994-34b202c01f31' }))
  }));

  const payload = JSON.parse(Buffer.from(res.Payload).toString());
  console.log('Result:', JSON.stringify(payload, null, 2));

  console.log('\nInvoking CloudCampus-Assignment-Reminder...');
  const remRes = await lambda.send(new InvokeCommand({
    FunctionName: 'CloudCampus-Assignment-Reminder',
    InvocationType: 'RequestResponse',
    Payload: Buffer.from(JSON.stringify({ source: 'manual-test' }))
  }));
  const remPayload = JSON.parse(Buffer.from(remRes.Payload).toString());
  console.log('Reminder Result:', JSON.stringify(remPayload, null, 2));
}

testDirect().catch(console.error);
