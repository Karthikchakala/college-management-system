import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl } from './secrets';

let prismaInstance: PrismaClient | null = null;

export function getPrismaClient(urlOverride?: string): PrismaClient {
  if (!prismaInstance) {
    const options: any = {
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    };

    if (urlOverride) {
      options.datasources = {
        db: {
          url: urlOverride,
        },
      };
    }

    prismaInstance = new PrismaClient(options);
  }
  return prismaInstance;
}

export async function initDatabase(): Promise<PrismaClient> {
  const databaseUrl = await getDatabaseUrl();
  return getPrismaClient(databaseUrl);
}

const prisma = getPrismaClient();

export default prisma;
