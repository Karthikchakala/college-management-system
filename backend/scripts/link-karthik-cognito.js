#!/usr/bin/env node
/**
 * Safely updates the Karthik Chakala student account to use the verified Cognito email and sub.
 * 
 * Target:
 *  Previous email: student@campus.edu
 *  New email:      karthikc11105@gmail.com
 *  Cognito sub:    8458d4b8-a071-70f2-068d-daa6d1caa912
 *  Role:           STUDENT (unchanged)
 *  Status:         ACTIVE (unchanged)
 */

const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function resolveDatabaseUrl() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secretName = process.env.AWS_SECRET_NAME || (isProduction ? 'cloudcampus/rds' : null);
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!secretName || (!isProduction && process.env.DATABASE_URL && !process.env.FORCE_AWS_SECRETS)) {
    return process.env.DATABASE_URL;
  }

  const client = new SecretsManagerClient({ region });
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));
  const parsed = JSON.parse(response.SecretString);
  if (parsed.databaseUrl) return parsed.databaseUrl;
  const username = encodeURIComponent(parsed.username || 'campusadmin');
  const password = encodeURIComponent(parsed.password);
  const host = parsed.host || 'cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com';
  const port = parsed.port || 5432;
  const dbname = parsed.dbname || parsed.database || 'campusadmin';
  return `postgresql://${username}:${password}@${host}:${port}/${dbname}?sslmode=require`;
}

async function main() {
  const targetNewEmail = 'karthikc11105@gmail.com';
  const targetCognitoSub = '8458d4b8-a071-70f2-068d-daa6d1caa912';

  console.log('[Cognito Link Script] Starting safety checks...');

  try {
    const dbUrl = await resolveDatabaseUrl();
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    // 1. Check if the Gmail address is already in use
    const existingGmailUser = await prisma.user.findUnique({
      where: { email: targetNewEmail },
      include: { student: true },
    });

    if (existingGmailUser) {
      console.log(`[Cognito Link Script] User record with ${targetNewEmail} already exists (ID: ${existingGmailUser.id}).`);
      
      // Update cognitoSub if needed
      if (existingGmailUser.cognitoSub !== targetCognitoSub) {
        const updated = await prisma.user.update({
          where: { id: existingGmailUser.id },
          data: { cognitoSub: targetCognitoSub, status: 'ACTIVE' },
        });
        console.log(`[Cognito Link Script] Updated cognitoSub to ${targetCognitoSub} on existing user ${targetNewEmail}.`);
      } else {
        console.log(`[Cognito Link Script] cognitoSub already matches ${targetCognitoSub}. No change needed.`);
      }

      const finalUser = await prisma.user.findUnique({
        where: { id: existingGmailUser.id },
        select: { id: true, email: true, role: true, status: true, cognitoSub: true, student: true },
      });
      console.log('[Cognito Link Script] Verified User Record:', JSON.stringify(finalUser, null, 2));
      await prisma.$disconnect();
      process.exit(0);
    }

    // 2. Check if the Cognito sub is assigned to another user
    const existingSubUser = await prisma.user.findUnique({
      where: { cognitoSub: targetCognitoSub },
    });

    if (existingSubUser && existingSubUser.email !== 'student@campus.edu') {
      console.error(`[Cognito Link Script] ERROR: cognitoSub ${targetCognitoSub} is already linked to a different user: ${existingSubUser.email}`);
      process.exit(1);
    }

    // 3. Find the candidate student user (student@campus.edu)
    const studentUser = await prisma.user.findUnique({
      where: { email: 'student@campus.edu' },
      include: { student: true },
    });

    if (!studentUser) {
      console.error('[Cognito Link Script] ERROR: Could not find user record for student@campus.edu');
      process.exit(1);
    }

    // 4. Verify that this user is associated with Karthik Chakala
    console.log(`[Cognito Link Script] Found student user: ${studentUser.email} (ID: ${studentUser.id})`);
    if (studentUser.student) {
      console.log(`[Cognito Link Script] Verified associated Student profile: ${studentUser.student.firstName} ${studentUser.student.lastName} (Enrollment: ${studentUser.student.enrollmentNumber})`);
    } else {
      console.warn('[Cognito Link Script] Warning: No Student profile attached to student@campus.edu');
    }

    // 5. Update user email and cognitoSub
    const updatedUser = await prisma.user.update({
      where: { id: studentUser.id },
      data: {
        email: targetNewEmail,
        cognitoSub: targetCognitoSub,
        status: 'ACTIVE',
      },
      include: { student: true },
    });

    console.log('[Cognito Link Script] SUCCESS! User record successfully updated:');
    console.log(`  User ID:       ${updatedUser.id}`);
    console.log(`  Email:         ${updatedUser.email}`);
    console.log(`  Role:          ${updatedUser.role}`);
    console.log(`  Status:        ${updatedUser.status}`);
    console.log(`  CognitoSub:    ${updatedUser.cognitoSub}`);
    if (updatedUser.student) {
      console.log(`  Student Name:  ${updatedUser.student.firstName} ${updatedUser.student.lastName}`);
      console.log(`  Enrollment No: ${updatedUser.student.enrollmentNumber}`);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Cognito Link Script] Error:', error.message || error);
    process.exit(1);
  }
}

main();
