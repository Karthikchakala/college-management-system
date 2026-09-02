#!/usr/bin/env node
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { spawnSync } = require('child_process');

async function main() {
  const client = new SecretsManagerClient({ region: 'us-east-1' });
  const res = await client.send(new GetSecretValueCommand({ SecretId: 'cloudcampus/rds' }));
  const parsed = JSON.parse(res.SecretString);
  const username = encodeURIComponent(parsed.username || 'campusadmin');
  const password = encodeURIComponent(parsed.password);
  const host = parsed.host || 'cloudcampus-db.cgdikmcwmp0u.us-east-1.rds.amazonaws.com';
  const port = parsed.port || 5432;
  const dbname = parsed.dbname || parsed.database || 'campusadmin';
  const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${dbname}?sslmode=require`;

  const [,, cmd, ...args] = process.argv;
  const child = spawnSync(cmd, args, {
    env: { ...process.env, DATABASE_URL: databaseUrl, NODE_ENV: 'production' },
    stdio: 'inherit'
  });
  process.exit(child.status || 0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
