import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

let cachedDatabaseUrl: string | null = null;

export interface DatabaseCredentials {
  username?: string;
  password?: string;
  host?: string;
  port?: number | string;
  dbname?: string;
  databaseUrl?: string;
}

/**
 * Resolves the database connection URL.
 * In production, it securely fetches credentials from AWS Secrets Manager using the EC2 IAM Role.
 * In development / test, it uses DATABASE_URL from environment variables.
 */
export async function getDatabaseUrl(): Promise<string> {
  if (cachedDatabaseUrl) {
    return cachedDatabaseUrl;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const secretName = process.env.AWS_SECRET_NAME || (isProduction ? 'cloudcampus/rds' : null);
  const region = process.env.AWS_REGION || 'us-east-1';

  // In local development/test without secret name, use standard DATABASE_URL
  if (!secretName || (!isProduction && process.env.DATABASE_URL && !process.env.FORCE_AWS_SECRETS)) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required when not using AWS Secrets Manager');
    }
    cachedDatabaseUrl = process.env.DATABASE_URL;
    return cachedDatabaseUrl;
  }

  try {
    const client = new SecretsManagerClient({ region });
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secretName,
      })
    );

    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} does not contain SecretString`);
    }

    let resolvedUrl: string;

    // Check if SecretString is JSON
    try {
      const parsed: DatabaseCredentials = JSON.parse(response.SecretString);
      if (parsed.databaseUrl) {
        resolvedUrl = parsed.databaseUrl;
      } else if (parsed.username && parsed.password && parsed.host) {
        const username = encodeURIComponent(parsed.username);
        const password = encodeURIComponent(parsed.password);
        const host = parsed.host;
        const port = parsed.port || 5432;
        const dbname = parsed.dbname || 'campusadmin';
        resolvedUrl = `postgresql://${username}:${password}@${host}:${port}/${dbname}?sslmode=require`;
      } else {
        throw new Error('Secret JSON missing expected database connection fields');
      }
    } catch (parseError: any) {
      // If not JSON, check if it's already a connection string
      if (response.SecretString.startsWith('postgresql://') || response.SecretString.startsWith('postgres://')) {
        resolvedUrl = response.SecretString;
        if (isProduction && !resolvedUrl.includes('sslmode=')) {
          resolvedUrl += (resolvedUrl.includes('?') ? '&' : '?') + 'sslmode=require';
        }
      } else {
        throw new Error(`Failed to parse secret structure from ${secretName}`);
      }
    }

    cachedDatabaseUrl = resolvedUrl;
    // Set for Prisma CLI / internal Prisma references if needed
    process.env.DATABASE_URL = resolvedUrl;
    return cachedDatabaseUrl;
  } catch (error: any) {
    console.error(`[SecretsManager] Failed to retrieve database secret "${secretName}" from region "${region}":`, error.message);
    throw error;
  }
}
