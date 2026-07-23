# Internal Ticket/Project Tracker — MVP Architecture

**Scope note:** This is the trimmed-down version of the original enterprise ticketing/ERP plan. Internal tracker only — no external customers, no SLA engine, no customer portal. Real-time, audit trail, time tracking, and SLA are deferred to post-MVP (see §9).

---

## 1. System Overview

```
                              ┌─────────────────────────────┐
                              │        Client Layer          │
                              │  Next.js 15 (App Router)     │
                              │  apps/web                    │
                              └───────────────┬───────────────┘
                                              │ HTTPS
                              ┌───────────────▼───────────────┐
                              │         API Layer               │
                              │   NestJS + Fastify (apps/api)   │
                              │   REST                          │
                              └───────────────┬───────────────┘
                                              │
                              ┌───────────────▼───────────────┐
                              │      PostgreSQL 16              │
                              │      (Prisma / packages/db)     │
                              │      transactional data only    │
                              └─────────────────────────────────┘
```

MongoDB, Redis/Bull, and WebSockets are not part of the MVP. Nothing here blocks adding them later — the org-scoped Postgres model underneath doesn't change.

---

## 2. Monorepo Layout

```
turborepo-root/
├── apps/
│   ├── web/                    # Next.js 15, App Router — (auth) and (app) zones only
│   └── api/                    # NestJS on Fastify
├── packages/
│   ├── db/                     # Prisma schema + lazy Proxy singleton client
│   ├── auth/                   # Better Auth config (organization plugin) shared across api/web
│   ├── ui/                     # Shared component library (shadcn-based)
│   ├── config/                 # eslint, tsconfig, tailwind presets
│   └── types/                  # Shared Zod schemas — single source of truth for API contracts
├── turbo.json
└── pnpm-workspace.yaml
```

---

## 3. Multi-Tenancy (Better Auth `organization` plugin)

You already have this modeled via Better Auth's org plugin — no custom `Tenant` table needed:

- **`Organization`** = the tenant.
- **`Member`** = a user's role within an org (`ADMIN | MANAGER | MEMBER`, configured via Better Auth's access-control API — see §4).
- **`Invitation`** = the invite flow, already has `organizationId`, `email`, `role`, `status`, `expiresAt`, `inviterId`. Use `auth.api.createInvitation` / `acceptInvitation` rather than a hand-rolled token table.
- **`Session.activeOrganizationId`** = the field your app reads to know which org the current request is scoped to.

**Enforcement, two layers:**
1. **Application layer** — an `OrganizationInterceptor` reads `session.activeOrganizationId` and sets it as the scoping value for every Prisma query in the request (via `prisma.$extends` middleware).
2. **Database layer** — Postgres RLS as the last line of defense:
```sql
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_isolation ON "Ticket"
  USING (organization_id = current_setting('app.current_org')::text);
```
`app.current_org` is set via `SET LOCAL` at the start of each request/transaction, sourced from `session.activeOrganizationId`.

---

## 4. Roles & Permissions

Internal tracker only, so the role set simplifies to:

| Role | Can do |
|---|---|
| `ADMIN` | Manage org, invite/remove members, full ticket CRUD |
| `MANAGER` | Full ticket CRUD, assign tickets, view all org tickets |
| `MEMBER` | Create tickets, edit/comment on tickets they created or are assigned |

Configure via Better Auth's `organization()` plugin access-control API:

```ts
// packages/auth/permissions.ts
import { createAccessControl } from "better-auth/plugins/access";

const statement = {
  ticket: ["create", "read", "update", "assign", "delete"],
} as const;

const ac = createAccessControl(statement);

export const member = ac.newRole({ ticket: ["create", "read", "update"] });
export const manager = ac.newRole({ ticket: ["create", "read", "update", "assign"] });
export const admin   = ac.newRole({ ticket: ["create", "read", "update", "assign", "delete"] });
```

No `CUSTOMER` role — there are no external submitters in this version.

---

## 5. Core Data Model

```prisma
model Ticket {
  id             String       @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  title          String
  description    String?
  status         TicketStatus @default(OPEN) // OPEN, IN_PROGRESS, DONE, CLOSED
  priority       Priority?    // optional, no SLA tied to it
  assigneeId     String?
  assignee       User?        @relation("TicketAssignee", fields: [assigneeId], references: [id])
  creatorId      String
  creator        User         @relation("TicketCreator", fields: [creatorId], references: [id])
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  comments       Comment[]

  @@index([organizationId, status])
}

model Comment {
  id        String   @id @default(cuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  body      String
  createdAt DateTime @default(now())
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  DONE
  CLOSED
}

enum Priority {
  P0
  P1
  P2
  P3
}
```

Everything ties back to `organizationId`. `User`, `Organization`, `Member`, `Invitation` come from Better Auth's schema as-is.

---

## 6. API Surface (NestJS)

```
POST   /tickets                 create ticket
GET    /tickets                 list tickets (org-scoped, filter by status/assignee)
GET    /tickets/:id             ticket detail
PATCH  /tickets/:id             edit title/description/priority
PATCH  /tickets/:id/status      status transition
PATCH  /tickets/:id/assign      assign/reassign
POST   /tickets/:id/comments    add comment
GET    /tickets/:id/comments    list comments
```

Guards on every route: `OrganizationInterceptor` (tenant scoping) + `RolesGuard` (`@Roles('ADMIN','MANAGER')` where relevant) — two independent checks, not combined into one.

DTOs via `class-validator` or `nestjs-zod`, `whitelist: true, forbidNonWhitelisted: true`.

---

## 7. Frontend Zones (Next.js App Router)

```
apps/web/app/
├── (auth)/     # signup, login, org onboarding
└── (app)/      # ticket board/list view, ticket detail, org settings
```

No `(portal)`, no `(super-admin)` — both were customer/cross-tenant concerns that don't apply here.

---

## 8. Security (unchanged from before, still applies)

- `class-validator` DTOs on every endpoint, reject unknown fields.
- `@nestjs/throttler` — single rate-limit tier is fine now (no customer-facing surface to worry about separately).
- Helmet + CORS allow-list.
- `.env` for local dev; document a production secrets path even if unimplemented.

---

## 9. Deferred (add back in this order, only when needed)

1. **Real-time (WebSocket)** — once multiple people are using it together and status updates need to be live.
2. **Audit trail (MongoDB)** — once "who changed what, when" matters (compliance, disputes, debugging).
3. **Time tracking** — once billing or capacity reporting is a real need.
4. **SLA engine** — only if external customers or formal internal response-time commitments come back into scope.

Each of these plugs back in without changing the org-scoped Postgres core — that's the point of building it this way.

---

## 10. Build Order

1. Prisma schema: `Ticket`, `Comment`, enums — migrate
2. `organization()` plugin config: roles + access control (§4)
3. `OrganizationInterceptor` + RLS policies (§3)
4. Ticket CRUD API + guards (§6)
5. Frontend: `(auth)` zone (signup/login/org creation), `(app)` zone (board + detail view)
6. Invite flow using Better Auth's built-in `Invitation` model

---

## 11. Backend Module Structure (NestJS)

```
apps/api/src/
├── main.ts                       # bootstrap, ConfigModule loads first
├── app.module.ts                 # root module, imports everything below
├── modules/
│   ├── auth/
│   │   └── auth.module.ts        # wraps @thallesp/nestjs-better-auth
│   ├── organizations/
│   │   ├── organizations.module.ts
│   │   ├── organizations.controller.ts   # invite, member management
│   │   └── organizations.service.ts
│   ├── tickets/
│   │   ├── tickets.module.ts
│   │   ├── tickets.controller.ts
│   │   ├── tickets.service.ts
│   │   └── dto/
│   │       ├── create-ticket.dto.ts
│   │       ├── update-ticket.dto.ts
│   │       └── assign-ticket.dto.ts
│   └── comments/
│       ├── comments.module.ts
│       ├── comments.controller.ts
│       └── comments.service.ts
└── common/
    ├── guards/
    │   ├── auth.guard.ts          # validates Better Auth session
    │   └── roles.guard.ts         # checks @Roles() metadata
    ├── interceptors/
    │   └── organization.interceptor.ts   # sets RLS scope per request
    ├── decorators/
    │   ├── roles.decorator.ts     # @Roles('ADMIN','MANAGER')
    │   └── current-user.decorator.ts     # @CurrentUser() param decorator
    └── filters/
        └── http-exception.filter.ts      # global error shape, see §14
```

**Layering rule:** controllers only orchestrate — they call one service method and return its result. Business logic (status transition rules, permission checks beyond simple role gates) lives in the service. Services never touch `req`/`res` directly; the interceptor/guards hand them a scoped Prisma client and the current user.

**Guard order matters:** `AuthGuard` (is there a valid session?) → `OrganizationInterceptor` (scope every downstream query to `activeOrganizationId`) → `RolesGuard` (does this role have permission for this route?). Keeping these as three separate, composable pieces — instead of one mega-guard — means each one is independently testable and a bug in one doesn't silently mask a bug in another.

---

## 12. Frontend Structure (Next.js App Router)

```
apps/web/app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── layout.tsx                 # no session required
├── (app)/
│   ├── layout.tsx                 # fetches session + org, redirects if none
│   ├── tickets/
│   │   ├── page.tsx                # list/board view (Server Component)
│   │   └── [id]/page.tsx           # ticket detail
│   └── settings/
│       └── members/page.tsx        # invite + role management
└── layout.tsx                      # root layout, providers

apps/web/src/
├── components/
│   ├── ui/                         # shadcn primitives
│   └── tickets/
│       ├── ticket-card.tsx
│       ├── ticket-form.tsx
│       └── status-select.tsx
├── lib/
│   ├── api-client.ts                # typed fetch wrapper, forwards cookies
│   └── auth-client.ts               # Better Auth client instance
└── hooks/
    └── use-tickets.ts               # TanStack Query hooks
```

**Data-fetching split:**
- **Initial page load** → Server Components fetch directly from the NestJS API, forwarding the session cookie. No client-side loading spinner for first paint.
- **Mutations & subsequent client-side updates** (status change, assign, comment) → TanStack Query (`useMutation`), with `invalidateQueries` on success. This gets you optimistic UI and cache consistency without hand-rolling either.
- **No separate global state library needed for MVP.** Server state lives in TanStack Query's cache; the only client-only state (filter selections, active tab) can live in URL search params (`nuqs`) so it's shareable/bookmarkable for free.

`packages/types` (Zod schemas) is what both `api-client.ts` and the NestJS DTOs import from — this is the piece that keeps frontend and backend from drifting apart as the ticket shape evolves.

---

## 13. Request Lifecycle (a single ticket update, end to end)

1. **Client** — user changes a ticket's status in the UI. `useMutation` fires a `PATCH /tickets/:id/status` request with credentials included (session cookie).
2. **AuthGuard** — verifies the Better Auth session cookie is valid. Invalid/missing → `401` immediately, request never reaches business logic.
3. **OrganizationInterceptor** — reads `session.activeOrganizationId`, opens a Prisma `$transaction`, runs `SET LOCAL app.current_org = '<id>'` so every query in this request is RLS-scoped.
4. **RolesGuard** — checks the route's `@Roles()` metadata against the user's `Member.role` for this org. Insufficient role → `403`.
5. **Controller** — validates the request body against the DTO (`class-validator`/`zod`), calls `TicketsService.updateStatus()`.
6. **Service** — applies any status-transition rules (e.g. can't go straight from `OPEN` to `CLOSED`), calls Prisma to update the row. RLS at the DB layer double-checks `organization_id` even if the interceptor had a bug.
7. **Response** — service returns the updated ticket; controller returns it in the standard success shape (§14). Transaction commits.
8. **Client** — `onSuccess` invalidates the relevant TanStack Query cache key, UI re-renders with fresh data.

Two independent authorization checks happen (step 2 auth, step 4 role) before a third, structural one (step 6 RLS) — this is the "defense in depth" pattern from §3, applied per-request rather than just per-table.

---

## 14. Error Handling, Validation & API Response Conventions

**Validation:** every DTO uses `class-validator` decorators; global `ValidationPipe` configured with:
```ts
new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })
```
`whitelist` strips unknown fields silently; `forbidNonWhitelisted` rejects the request instead if unknown fields are present — use the latter for write endpoints so typos in client code fail loudly during development.

**Success responses** — return the resource directly, no wrapper envelope:
```json
{ "id": "tk_123", "title": "Fix login bug", "status": "OPEN" }
```
Lists return a plain array (or `{ items: [...], nextCursor }` once you add pagination — not needed at MVP scale).

**Error responses** — a global `HttpExceptionFilter` normalizes every thrown error into one shape:
```json
{ "error": { "code": "VALIDATION_FAILED", "message": "title is required" } }
```

**Status code conventions:**

| Code | Meaning | Example |
|---|---|---|
| 400 | Validation failed | Missing required field |
| 401 | No/invalid session | Cookie missing or expired |
| 403 | Authenticated but not permitted | `MEMBER` tries to assign a ticket |
| 404 | Not found (or in a different org — never leak that distinction) | Ticket ID doesn't resolve within the scoped org |
| 409 | Conflict | Invalid status transition |
| 500 | Unexpected server error | Unhandled exception — logged, generic message returned to client |

**Important 403 vs 404 rule:** if a `Ticket` exists but belongs to a different organization, return `404`, not `403`. Returning `403` confirms the resource exists somewhere — a minor information leak across tenants that's easy to avoid by just treating "not in my org" the same as "doesn't exist."

**Frontend handling:** TanStack Query's `onError` reads the normalized error message and surfaces it via a toast; a top-level error boundary catches anything unhandled and shows a generic fallback rather than a blank screen.
