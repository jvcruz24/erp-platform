import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { organization } from 'better-auth/plugins';
import { prisma } from '@repo/db';

export function createAuth(options: {
  secret: string;
  baseURL: string;
  googleId: string;
  googleSecret: string;
}) {
  return betterAuth({
    database: prismaAdapter(prisma, {
      provider: 'postgresql',
      debugLogs: true,
    }),
    secret: options.secret,
    baseURL: options.baseURL,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: options.googleId as string,
        clientSecret: options.googleSecret as string,
      },
    },
    trustedOrigins: [
      'http://localhost:5001',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:5001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ],
    plugins: [organization()],
  });
}
