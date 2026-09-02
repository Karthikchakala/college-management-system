const { LambdaClient, ListFunctionsCommand, InvokeCommand } = require('@aws-sdk/client-lambda');

const lambda = new LambdaClient({ region: 'us-east-1' });

async function verifyAllLambdas() {
  console.log('=== VERIFYING ALL LAMBDA FUNCTIONS IN US-EAST-1 ===');
  const list = await lambda.send(new ListFunctionsCommand({}));
  for (const fn of list.Functions) {
    console.log(`\nFunction: ${fn.FunctionName}`);
    console.log(`ARN: ${fn.FunctionArn}`);
    console.log(`Runtime: ${fn.Runtime}`);
    console.log(`State: ${fn.State}`);
    console.log(`Memory: ${fn.MemorySize}MB | Timeout: ${fn.Timeout}s`);

    // Invoke test
    if (fn.FunctionName.includes('CloudCampus')) {
      try {
        const payload = fn.FunctionName.includes('Notification')
          ? { assignmentId: 'cf944cee-df8b-4dc9-b994-34b202c01f31' }
          : { source: 'health-check' };

        const invRes = await lambda.send(new InvokeCommand({
          FunctionName: fn.FunctionName,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify(payload))
        }));
        console.log(`Invocation: HTTP ${invRes.StatusCode} (Function Error: ${invRes.FunctionError || 'None'})`);
      } catch (err) {
        console.warn(`Invocation warning:`, err.message);
      }
    }
  }
}

verifyAllLambdas().catch(console.error);
