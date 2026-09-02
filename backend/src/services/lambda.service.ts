import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const region = process.env.AWS_REGION || 'us-east-1';
const lambdaClient = new LambdaClient({ region });

/**
 * Triggers the CloudCampus-Assignment-Notification Lambda asynchronously (Event invocation).
 */
export async function triggerAssignmentNotificationLambda(assignmentId: string): Promise<void> {
  try {
    const payload = JSON.stringify({ assignmentId });
    const command = new InvokeCommand({
      FunctionName: 'CloudCampus-Assignment-Notification',
      InvocationType: 'Event', // Asynchronous execution: returns immediately with 202 Accepted
      Payload: Buffer.from(payload),
    });
    await lambdaClient.send(command);
    console.log(JSON.stringify({
      level: 'INFO',
      action: 'LAMBDA_ASYNC_INVOKE',
      function: 'CloudCampus-Assignment-Notification',
      assignmentId,
      message: 'Successfully queued assignment notification processing in AWS Lambda'
    }));
  } catch (error: any) {
    console.warn(JSON.stringify({
      level: 'WARN',
      action: 'LAMBDA_INVOKE_FAILED',
      function: 'CloudCampus-Assignment-Notification',
      assignmentId,
      error: error.message
    }));
  }
}

/**
 * Triggers the CloudCampus-Assignment-Reminder Lambda on demand or for testing.
 */
export async function triggerAssignmentReminderLambda(): Promise<any> {
  try {
    const command = new InvokeCommand({
      FunctionName: 'CloudCampus-Assignment-Reminder',
      InvocationType: 'RequestResponse', // Synchronous for manual testing/metrics
      Payload: Buffer.from(JSON.stringify({ source: 'manual-trigger' })),
    });
    const res = await lambdaClient.send(command);
    const resultPayload = res.Payload ? Buffer.from(res.Payload).toString() : '{}';
    return JSON.parse(resultPayload);
  } catch (error: any) {
    console.error('Failed to trigger reminder Lambda:', error);
    throw error;
  }
}
