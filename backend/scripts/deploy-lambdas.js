const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  LambdaClient,
  CreateFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  GetFunctionCommand,
  AddPermissionCommand
} = require('@aws-sdk/client-lambda');
const {
  EventBridgeClient,
  PutRuleCommand,
  PutTargetsCommand
} = require('@aws-sdk/client-eventbridge');

const region = 'us-east-1';
const lambda = new LambdaClient({ region });
const eventbridge = new EventBridgeClient({ region });

const ROLE_ARN = 'arn:aws:iam::511225358997:role/CloudCampus-Lambda-Execution-Role';
const SNS_TOPIC_ARN = 'arn:aws:sns:us-east-1:511225358997:CloudCampus-Notifications';
const VPC_CONFIG = {
  SubnetIds: ['subnet-0ea7b2a7ac8952aa9', 'subnet-02f2f01a92b63d057'],
  SecurityGroupIds: ['sg-084f06c983a45c8b6']
};

function createZip(sourceFile, outputZip) {
  const lambdaRoot = path.resolve(__dirname, '..', '..', 'lambda');
  const tempDir = path.join(lambdaRoot, '_build_temp');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

  // Copy handler file as index.js
  fs.copyFileSync(sourceFile, path.join(tempDir, 'index.js'));

  // Copy node_modules from lambda/node_modules
  const nodeModulesSrc = path.join(lambdaRoot, 'node_modules');
  const nodeModulesDest = path.join(tempDir, 'node_modules');
  execSync(`xcopy /E /I /Y /Q "${nodeModulesSrc}" "${nodeModulesDest}"`, { stdio: 'inherit' });

  // Create Zip archive using PowerShell
  if (fs.existsSync(outputZip)) fs.unlinkSync(outputZip);
  execSync(`powershell -Command "Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${outputZip}' -Force"`, { stdio: 'inherit' });
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`Created zip package: ${outputZip} (${fs.statSync(outputZip).size} bytes)`);
}

async function deployLambda(functionName, zipPath, timeout = 30) {
  const zipBuffer = fs.readFileSync(zipPath);
  console.log(`\nDeploying Lambda: ${functionName}...`);

  let exists = false;
  try {
    await lambda.send(new GetFunctionCommand({ FunctionName: functionName }));
    exists = true;
  } catch (err) {
    if (err.name !== 'ResourceNotFoundException') throw err;
  }

  if (exists) {
    console.log(`Updating existing Lambda code for ${functionName}...`);
    await lambda.send(new UpdateFunctionCodeCommand({
      FunctionName: functionName,
      ZipFile: zipBuffer
    }));

    console.log(`Waiting for code update to settle...`);
    await new Promise(r => setTimeout(r, 6000));

    console.log(`Updating configuration for ${functionName}...`);
    await lambda.send(new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Runtime: 'nodejs20.x',
      Handler: 'index.handler',
      Role: ROLE_ARN,
      Timeout: timeout,
      MemorySize: 256,
      VpcConfig: VPC_CONFIG,
      Environment: {
        Variables: {
          SNS_TOPIC_ARN,
          NODE_ENV: 'production'
        }
      }
    }));
  } else {
    console.log(`Creating new Lambda ${functionName}...`);
    await lambda.send(new CreateFunctionCommand({
      FunctionName: functionName,
      Runtime: 'nodejs20.x',
      Role: ROLE_ARN,
      Handler: 'index.handler',
      Code: { ZipFile: zipBuffer },
      Timeout: timeout,
      MemorySize: 256,
      VpcConfig: VPC_CONFIG,
      Environment: {
        Variables: {
          SNS_TOPIC_ARN,
          NODE_ENV: 'production'
        }
      }
    }));
  }
  console.log(`✓ Lambda ${functionName} deployed successfully.`);
}

async function setupEventBridgeSchedule() {
  const ruleName = 'CloudCampus-Assignment-Reminder-Schedule';
  const lambdaName = 'CloudCampus-Assignment-Reminder';

  console.log(`\n=== CONFIGURING EVENTBRIDGE SCHEDULE: ${ruleName} ===`);
  const ruleRes = await eventbridge.send(new PutRuleCommand({
    Name: ruleName,
    ScheduleExpression: 'rate(1 day)',
    State: 'ENABLED',
    Description: 'Daily scheduled trigger for CloudCampus assignment deadline reminder processing'
  }));
  console.log('EventBridge Rule ARN:', ruleRes.RuleArn);

  const lambdaRes = await lambda.send(new GetFunctionCommand({ FunctionName: lambdaName }));
  const lambdaArn = lambdaRes.Configuration?.FunctionArn;

  await eventbridge.send(new PutTargetsCommand({
    Rule: ruleName,
    Targets: [
      {
        Id: 'AssignmentReminderLambdaTarget',
        Arn: lambdaArn
      }
    ]
  }));
  console.log(`Target ${lambdaArn} attached to rule ${ruleName}`);

  // Add permission for EventBridge to invoke Lambda
  try {
    await lambda.send(new AddPermissionCommand({
      FunctionName: lambdaName,
      StatementId: 'EventBridgeReminderSchedulePermission',
      Action: 'lambda:InvokeFunction',
      Principal: 'events.amazonaws.com',
      SourceArn: ruleRes.RuleArn
    }));
    console.log('Added invocation permission for EventBridge on Lambda');
  } catch (err) {
    if (err.name === 'ResourceConflictException') {
      console.log('Permission already exists.');
    } else {
      console.warn('Notice adding permission:', err.message);
    }
  }
}

async function main() {
  const lambdaDir = path.resolve(__dirname, '..', '..', 'lambda');
  const notifZip = path.join(lambdaDir, 'assignment-notification.zip');
  const reminderZip = path.join(lambdaDir, 'assignment-reminder.zip');

  console.log('=== PACKAGING LAMBDAS ===');
  createZip(path.join(lambdaDir, 'assignment-notification', 'index.js'), notifZip);
  createZip(path.join(lambdaDir, 'assignment-reminder', 'index.js'), reminderZip);

  console.log('\n=== DEPLOYING LAMBDAS TO AWS US-EAST-1 ===');
  await deployLambda('CloudCampus-Assignment-Notification', notifZip, 30);
  await deployLambda('CloudCampus-Assignment-Reminder', reminderZip, 60);

  await setupEventBridgeSchedule();

  console.log('\n=== ALL LAMBDAS & EVENTBRIDGE SCHEDULE DEPLOYED ===');
}

main().catch(console.error);
