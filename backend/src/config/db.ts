import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from './secrets';

let prismaInstance: PrismaClient | null = null;

/**
 * Returns or creates the active PrismaClient singleton instance.
 * If urlOverride is provided, any existing instance is cleanly replaced with the new datasource URL.
 */
export function getPrismaClient(urlOverride?: string): PrismaClient {
  if (urlOverride) {
    if (prismaInstance) {
      prismaInstance.$disconnect().catch(() => {});
    }
    const options: any = {
      datasources: {
        db: {
          url: urlOverride,
        },
      },
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    };
    prismaInstance = new PrismaClient(options);
    return prismaInstance;
  }

  if (!prismaInstance) {
    const options: any = {
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    };
    if (process.env.DATABASE_URL) {
      options.datasources = {
        db: {
          url: process.env.DATABASE_URL,
        },
      };
    }
    prismaInstance = new PrismaClient(options);
  }
  return prismaInstance;
}

/**
 * Resolves database credentials dynamically (from AWS Secrets Manager in production,
 * or local DATABASE_URL in development) and initializes the active PrismaClient.
 */
export async function initDatabase(): Promise<PrismaClient> {
  const databaseUrl = await getDatabaseUrl();
  process.env.DATABASE_URL = databaseUrl;
  return getPrismaClient(databaseUrl);
}

/**
 * Dynamic Proxy export so all modules importing `prisma` always interact with
 * the active, dynamically initialized database client without stale import-time binding.
 */
const prisma = new Proxy({} as PrismaClient, {
  get(target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client as any, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
