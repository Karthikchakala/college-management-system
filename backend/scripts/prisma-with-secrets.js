#!/usr/bin/env node
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { spawnSync } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function resolveDatabaseUrl() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secretName = process.env.AWS_SECRET_NAME || (isProduction ? 'cloudcampus/rds' : null);
  const region = process.env.AWS_REGION || 'us-east-1';

  // In development without secret name, use local DATABASE_URL
  if (!secretName || (!isProduction && process.env.DATABASE_URL && !process.env.FORCE_AWS_SECRETS)) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required in development mode.');
    }
    return process.env.DATABASE_URL;
  }

  console.log(`[Prisma-Secrets] Resolving database credentials from AWS Secrets Manager ("${secretName}" in ${region})...`);

  const client = new SecretsManagerClient({ region });
  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: secretName,
    })
  );

  if (!response.SecretString) {
    throw new Error(`Secret ${secretName} does not contain SecretString`);
  }

  let resolvedUrl;
  try {
    const parsed = JSON.parse(response.SecretString);
    if (parsed.databaseUrl) {
      resolvedUrl = parsed.databaseUrl;
    } else {
      const username = encodeURIComponent(parsed.username || 'campusadmin');
      const password = encodeURIComponent(parsed.password);
      const host = parsed.host || 'cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com';
      const port = parsed.port || 5432;
      const dbname = parsed.dbname || parsed.database || 'campusadmin';
      resolvedUrl = `postgresql://${username}:${password}@${host}:${port}/${dbname}?sslmode=require`;
    }
  } catch (parseError) {
    if (response.SecretString.startsWith('postgresql://') || response.SecretString.startsWith('postgres://')) {
      resolvedUrl = response.SecretString;
      if (!resolvedUrl.includes('sslmode=')) {
        resolvedUrl += (resolvedUrl.includes('?') ? '&' : '?') + 'sslmode=require';
      }
    } else {
      throw new Error(`Failed to parse secret structure from ${secretName}`);
    }
  }

  console.log(`[Prisma-Secrets] Successfully resolved credentials for database: campusadmin`);
  return resolvedUrl;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/prisma-with-secrets.js <prisma-command> [options]');
    console.error('Example: node scripts/prisma-with-secrets.js migrate status');
    process.exit(1);
  }

  try {
    const databaseUrl = await resolveDatabaseUrl();
    const cmd = 'npx';
    let cmdArgs;

    if (args[0] === 'seed:production' || args[0] === 'production-seed') {
      cmdArgs = ['ts-node', 'prisma/production-seed.ts'];
    } else if (args[0] === 'seed:cse' || args[0] === 'cse-seed') {
      cmdArgs = ['ts-node', 'prisma/cse-seed.ts'];
    } else {
      cmdArgs = ['prisma', ...args];
    }

    const result = spawnSync(cmd, cmdArgs, {
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    });

    if (result.status !== null) {
      process.exit(result.status);
    }
  } catch (error) {
    console.error(`[Prisma-Secrets] Error: ${error.message || error}`);
    process.exit(1);
  }
}

main();
