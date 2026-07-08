import path from 'path';
import * as dotenv from 'dotenv';

// Dynamically locate the .env at the monorepo root
dotenv.config({ path: path.resolve(__dirname, '../../apps/api/.env') });

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'pnpm dlx tsx prisma/seed.ts',
  },
  datasource: {
    // Using Prisma's type-safe env() wrapper ensures strict valuation
    url: env('DATABASE_URL'),
  },
});
