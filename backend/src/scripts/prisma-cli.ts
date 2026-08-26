import dotenv from 'dotenv';
dotenv.config();

import { spawnSync } from 'child_process';
import { getDatabaseUrl } from '../config/secrets';

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('[Prisma-Runner] No Prisma arguments provided. Usage: node dist/scripts/prisma-cli.js <prisma-args>');
    process.exit(1);
  }

  try {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      console.log('[Prisma-Runner] Resolving production database credentials from AWS Secrets Manager...');
    }

    const databaseUrl = await getDatabaseUrl();

    if (isProduction) {
      console.log('[Prisma-Runner] Successfully resolved production database credentials.');
    }

    const prismaBin = 'npx';
    const result = spawnSync(prismaBin, ['prisma', ...args], {
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
  } catch (error: any) {
    console.error('[Prisma-Runner] Execution failed:', error.message || error);
    process.exit(1);
  }
}

main();
