import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from './generated/prisma/client.js';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Make sure ConfigModule has loaded your .env before any Prisma query runs.',
    );
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    // log: ['query', 'info', 'warn', 'error'],
  });
}

// Lazy singleton: nothing touches process.env or opens a connection
// until the first real property access (e.g. prisma.user.findFirst()),
// which happens at request time, long after NestJS's ConfigModule has
// already loaded .env. This removes the need for any manual dotenv
// loading in main.ts.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, _receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const client = globalForPrisma.prisma as any;
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
