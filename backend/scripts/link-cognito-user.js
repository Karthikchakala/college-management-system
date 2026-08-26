#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const dotenv = require('dotenv');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Load environment variables
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
  const args = process.argv.slice(2);
  const email = args[0];
  const cognitoSub = args[1];

  if (!email || !cognitoSub) {
    console.error('Usage: node scripts/link-cognito-user.js <email> <cognitoSub>');
    console.error('Example: node scripts/link-cognito-user.js admin@campus.edu 8458d4b8-a071-70f2-068d-daa6d1caa912');
    process.exit(1);
  }

  try {
    const dbUrl = await resolveDatabaseUrl();
    const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

    console.log(`[Cognito Link] Finding user with email: ${email}...`);
    const matchingUsers = await prisma.user.findMany({ where: { email } });

    if (matchingUsers.length === 0) {
      console.error(`[Cognito Link] Error: No user found with email "${email}"`);
      process.exit(1);
    }

    if (matchingUsers.length > 1) {
      console.error(`[Cognito Link] Error: Multiple users found with email "${email}"`);
      process.exit(1);
    }

    const user = matchingUsers[0];

    // Check if sub already exists on another user
    const existingWithSub = await prisma.user.findUnique({ where: { cognitoSub } });
    if (existingWithSub && existingWithSub.id !== user.id) {
      console.error(`[Cognito Link] Error: cognitoSub is already assigned to a different user (${existingWithSub.email})`);
      process.exit(1);
    }

    if (user.cognitoSub === cognitoSub) {
      console.log(`[Cognito Link] User ${email} is already linked to cognitoSub ${cognitoSub}. No change needed.`);
      process.exit(0);
    }

    if (user.cognitoSub !== null && user.cognitoSub !== cognitoSub) {
      console.error(`[Cognito Link] Error: User ${email} already has a different cognitoSub linked.`);
      process.exit(1);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { cognitoSub },
    });

    console.log(`[Cognito Link] SUCCESS: Successfully linked Cognito identity:`);
    console.log(`  User ID:    ${updated.id}`);
    console.log(`  Email:      ${updated.email}`);
    console.log(`  Role:       ${updated.role}`);
    console.log(`  CognitoSub: ${updated.cognitoSub}`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`[Cognito Link] Error: ${error.message || error}`);
    process.exit(1);
  }
}

main();
