# Postmortem: Intermittent `DATABASE_URL` Failure Causing Prisma "Access Denied" Errors

## Summary

Signup via Better Auth consistently failed with a Prisma `P1010` error —
`User was denied access on the database (not available)` — despite Postgres,
credentials, and the connection string all being correct. The real cause was
that `DATABASE_URL` was **intermittently `undefined`** at the moment the
Prisma client's connection pool was constructed, due to how `nest start
--watch` invokes the process and how relative `.env` paths were being
resolved. Prisma's driver-adapter layer (`@prisma/adapter-pg`) wraps *any*
underlying connection error — including "no password provided" — into the
same generic `P1010 DatabaseAccessDenied` message, which made the real
problem look like a database permissions issue for most of the debugging
session.

## Environment

- Turborepo monorepo, pnpm workspaces
- `apps/api`: NestJS (Fastify adapter), run locally on Windows (not
  containerized)
- `packages/db`: Prisma ORM, compiled via `tsc`, using
  `@prisma/adapter-pg` (driver adapters, `previewFeatures = ["driverAdapters"]`)
- `packages/auth`: Better Auth, using `@thallesp/nestjs-better-auth` +
  `better-auth/adapters/prisma`
- Postgres running in Docker (`postgres:16-alpine`), NOT containerized on
  the app side
- Prisma `7.8.0`, `@prisma/adapter-pg` `7.8.0`

## Symptom

```
prisma:error
Invalid `prisma.user.findFirst()` invocation:
User was denied access on the database `(not available)`

PrismaClientKnownRequestError: ... code: 'P1010'
```

This occurred specifically when Better Auth's Prisma adapter ran its first
query (`findFirst` on `user`) during signup.

## Investigation Timeline

### 1. Ruled out real Postgres permission issues
Initial hypothesis: `erp_user` lacked schema/table grants. Ruled out by
confirming:
- `erp_user` is the bootstrap superuser role created by the official
  `postgres` Docker image (since `POSTGRES_USER=erp_user` was set, no
  separate `postgres` role was even created).
- `\dt` inside the container showed all tables (`user`, `session`,
  `account`, etc.) owned by `erp_user` directly.

### 2. Ruled out Docker volume staleness
Confirmed the named volume was correctly initialized with the current
compose file's credentials (no leftover role/db from a prior config).

### 3. Ruled out raw network/auth issues
A standalone Node script using `pg.Pool` directly, with the exact
`DATABASE_URL` from `.env`, connected successfully and ran queries — proving
Postgres, the port mapping, and the credentials were all fine:

```js
const pool = new Pool({ connectionString: 'postgresql://erp_user:...' });
await pool.query('SELECT current_user, current_database()');
// -> CONNECTION OK
```

This was repeated with the full connection string including
`?schema=public&sslmode=disable` query params, also successful — ruling out
a `pg` connection-string parsing issue.

### 4. Investigated env-loading order (the real category of bug)
`app.module.ts` calls `createAuth()` (from `@repo/auth`) directly inside the
`@Module()` decorator's `imports` array. Because `@repo/auth` imports
`@repo/db`, and `packages/db/src/client.ts` constructs a `pg.Pool` and
`PrismaClient` **at module top level**:

```ts
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter, ... });
```

...this Pool gets constructed as a side effect of importing `@repo/db`,
which happens as soon as `app.module.ts` is loaded — potentially before
`ConfigModule.forRoot({ envFilePath: '../../.env' })` (which is just an
*array element*, evaluated at the same time, not a guaranteed prior step)
had any effect. `ConfigModule.forRoot()` also only populates
`process.env` for **NestJS's own `ConfigService` consumers**, and does so
too late for a module-level side effect like this to observe it reliably.

### 5. Attempted fixes and why they were flaky
- `dotenv-cli` (`dotenv -e ../../.env -- nest start --watch`) — works in
  principle, but relative path resolution depends on **the shell's cwd at
  invocation**, which varies depending on whether the script is run via
  `pnpm --filter api dev` from repo root vs. `cd apps/api && pnpm dev`.
- `NODE_OPTIONS="--env-file=../../.env"` — same relative-path fragility,
  plus `nest start --watch` runs through a webpack-based HMR process that
  can re-spawn/rebuild in ways where the effective cwd or `__dirname` for
  compiled output isn't guaranteed to stay at a fixed depth.

Direct evidence of the failure mode: a standalone script run with
`--env-file=../../.env` from `packages/db` threw:

```
SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string
```

This is what happens when `pg.Pool` is constructed with
`connectionString: undefined` — i.e., `DATABASE_URL` genuinely was not set
at that moment, in that process. Re-running the *identical* command
sometimes succeeded and sometimes didn't, confirming a race/path-resolution
issue rather than a deterministic code bug.

### 6. Confirmed the "access denied" error was a red herring
Once `DATABASE_URL` was reliably present, `prisma.user.findFirst()` — run
through the exact same adapter stack Better Auth uses — succeeded and
returned real rows. This proved:
- Prisma 7 + `@prisma/adapter-pg` + Better Auth's Prisma adapter work
  correctly together.
- The `P1010 DatabaseAccessDenied` message is a **generic wrapper** that
  `@prisma/adapter-pg`'s internal `onError` handler emits for any
  underlying connection failure (auth failure, missing password, network
  drop, etc.) — not specifically a permissions problem. This matches
  multiple open upstream issues (e.g. prisma/prisma#28795, #28836) where
  the same message masked unrelated root causes.

## Root Cause

`DATABASE_URL` was not reliably available in `process.env` at the exact
moment `packages/db/src/client.ts` constructed its `pg.Pool`, because env
loading depended on a relative file path (`../../.env`) resolved against
the process's current working directory — and that cwd was inconsistent
across different invocation methods (`pnpm --filter`, `nest start --watch`'s
webpack HMR, direct `node` invocation). When the Pool was built with
`connectionString: undefined`, `pg` failed SASL auth with no password,
which Prisma's driver-adapter error handler reported as a generic "access
denied" error — completely obscuring the real cause.

## Fix

Replaced all cwd-relative env loading (`dotenv-cli`, `NODE_OPTIONS
--env-file`) with an explicit, self-locating loader at the very top of
`apps/api/src/main.ts`:

- Walks upward from the compiled file's actual runtime directory
  (`__dirname`) until it finds `pnpm-workspace.yaml`, which unambiguously
  marks the monorepo root regardless of whether the code is running from
  `dist/`, `dist/src/`, or a webpack HMR output location.
- Loads `.env` from that root via `dotenv.config({ path })`.
- Fails loudly at boot (`throw new Error(...)`) if `DATABASE_URL` is still
  missing, instead of allowing a downstream Prisma query to fail with a
  misleading error minutes later.
- Relies on the fact that TypeScript compiles `import` statements to
  `require()` calls in the same order they appear in the source file (for
  CommonJS output, which Nest uses by default) — so placing the env-loading
  `import`s and `config()` call before `import { AppModule }` guarantees it
  executes before `@repo/auth` → `@repo/db`'s module-level `Pool`
  construction.

```ts
function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`Could not locate monorepo root from ${startDir}`);
}

const envPath = join(findMonorepoRoot(__dirname), '.env');
config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL failed to load from ${envPath}`);
}

// AppModule (and transitively @repo/auth, @repo/db) imported after this point
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
```

`apps/api`'s `dev` script was reverted to plain `nest start --watch` — no
`dotenv-cli` or `NODE_OPTIONS` needed anymore.

## Verification

- `prisma.user.findFirst()` succeeds consistently through the compiled
  `@repo/db` client.
- Signup via Better Auth's `/api/sign-up/email` endpoint completes
  successfully and creates a `user` row.
- Restarting via `nest start --watch` (triggering webpack HMR rebuilds)
  no longer intermittently breaks env loading.

## Follow-ups / Prevention

- [ ] Add a lightweight runtime assertion (already partially done via the
      `if (!process.env.DATABASE_URL) throw` guard) for other required env
      vars (`BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`) at boot.
- [ ] Consider extracting `findMonorepoRoot` + env loading into a small
      shared `packages/config` (or similar) utility so any other app in the
      monorepo (future workers, scripts) gets the same guarantee without
      copy-pasting.
- [ ] Add `dependsOn: ["^build"]` for `api`'s `dev`/`build` task in
      `turbo.json` if not already present, so a stale `packages/db` build
      output can't silently reintroduce a *different* class of "works
      standalone, fails in app" bug.
- [ ] File upstream feedback on prisma/prisma — the generic `P1010
      DatabaseAccessDenied` wrapping of unrelated connection errors (SASL
      failures, network drops, etc.) cost significant debugging time and
      matches multiple existing open issues (#28795, #28836). Worth a 👍 or
      a comment linking this case if opening a fresh issue.
