# ERP/Ticketing SaaS — Page Structure (Next.js App Router)

Organized by access zone. Routes assume `apps/web` with route groups for layout isolation: `(marketing)`, `(auth)`, `(portal)`, `(app)`.

---

## 1. Marketing / Public — `(marketing)`

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/pricing` | Plan comparison (Starter → Enterprise) |
| `/features` | Feature breakdown |
| `/contact` | Sales/contact form |
| `/legal/terms`, `/legal/privacy` | Legal |

---

## 2. Auth & Onboarding — `(auth)`

| Route | Purpose |
|---|---|
| `/login` | Better Auth sign-in |
| `/signup` | Sign-up (org creation) |
| `/forgot-password` / `/reset-password` | Password recovery |
| `/verify-email` | Email verification |
| `/accept-invite/[token]` | Teammate invite acceptance (AGENT/MANAGER/ADMIN only — CUSTOMER excluded per your rule) |
| `/onboarding` | Multi-step: plan selection → org setup → invite teammates |
| `/onboarding/plan` | Plan selection step |
| `/onboarding/invite` | Invite teammates step |

---

## 3. Customer Portal — `(portal)` — role: **CUSTOMER**

Customers never touch the internal app. Separate layout/subdomain optional (`portal.yourapp.com`).

| Route | Purpose |
|---|---|
| `/portal` | Dashboard — open tickets, status summary |
| `/portal/tickets` | My tickets list |
| `/portal/tickets/new` | Submit new ticket |
| `/portal/tickets/[id]` | Ticket detail + conversation thread |
| `/portal/knowledge-base` | Self-service articles |
| `/portal/knowledge-base/[slug]` | Article detail |
| `/portal/account` | Profile, org info |
| `/portal/billing` | Subscription/invoices (if customer-facing billing) |

---

## 4. Internal App — `(app)` — roles: **AGENT / MANAGER / ADMIN**

### 4.1 Core

| Route | Purpose | Access |
|---|---|---|
| `/dashboard` | Role-aware overview (agent: my queue; manager: team SLA health; admin: org health) | All internal |
| `/notifications` | Real-time notification inbox (Redis pub/sub feed) | All internal |
| `/profile` | Personal settings, notification prefs | All internal |

### 4.2 Tickets

| Route | Purpose | Access |
|---|---|---|
| `/tickets` | Ticket list (filter/sort, saved views) | All internal |
| `/tickets/board` | Kanban view by status | All internal |
| `/tickets/new` | Agent-created ticket (on behalf of customer) | Agent+ |
| `/tickets/[id]` | Detail: conversation, SLA countdown, time tracking widget, audit/activity feed (Mongo event stream), internal notes | All internal |
| `/queues` | Unassigned / my queue / team queues, SLA-breach-risk sorted | Agent+ |
| `/queues/[queueId]` | Specific queue view | Agent+ |

### 4.3 Customers/Accounts

| Route | Purpose | Access |
|---|---|---|
| `/customers` | Account list | Agent+ |
| `/customers/[id]` | Account detail: contacts, ticket history, contracts | Agent+ |

### 4.4 Time Tracking

| Route | Purpose | Access |
|---|---|---|
| `/time-tracking` | My logged time (per ticket, per day) | All internal |
| `/time-tracking/team` | Team timesheets, approval | Manager+ |

### 4.5 Reporting & Audit

| Route | Purpose | Access |
|---|---|---|
| `/reports` | Report hub | Manager+ |
| `/reports/sla-compliance` | SLA breach/compliance rates | Manager+ |
| `/reports/agent-performance` | Resolution time, ticket volume per agent | Manager+ |
| `/reports/time-tracking` | Billable/non-billable summaries | Manager+ |
| `/audit-log` | System-wide event stream (Mongo append-only) — filterable by user/entity/action | Admin (Manager: scoped view) |

### 4.6 Team Management

| Route | Purpose | Access |
|---|---|---|
| `/team` | Agent roster, workload distribution | Manager+ |
| `/team/[userId]` | Individual agent profile/stats | Manager+ |
| `/team/invite` | Send invites (AGENT/MANAGER/ADMIN only) | Admin |

### 4.7 Settings — `/settings/*` — Admin only unless noted

| Route | Purpose |
|---|---|
| `/settings/organization` | Org name, branding, timezone |
| `/settings/users-roles` | RBAC management — assign roles per user |
| `/settings/sla-policies` | Define SLA tiers, response/resolution targets |
| `/settings/ticket-fields` | Custom fields, priority/status schema |
| `/settings/notifications` | Org-wide notification rules |
| `/settings/integrations` | Webhooks, API keys, third-party connectors |
| `/settings/billing` | Subscription, plan, payment method, invoices |
| `/settings/security` | SSO, session policy, audit export |

---

## 5. Platform/Super Admin (if multi-tenant SaaS ops) — `(platform-admin)`

Only needed if *you* (the SaaS operator) need cross-org visibility — separate from customer-facing ADMIN role.

| Route | Purpose |
|---|---|
| `/platform/organizations` | All tenant orgs |
| `/platform/organizations/[orgId]` | Org detail, usage, plan |
| `/platform/impersonate` | Support impersonation (audit-logged) |
| `/platform/system-health` | Queue depth, DB/Redis/Mongo health |

---

## Notes / Open Decisions

- **Role gating**: enforce at layout level (`(app)/layout.tsx` checks session role) + API-level RBAC guard — don't rely on frontend routing alone.
- **`/tickets/[id]`** is the highest-complexity page: combines Postgres (ticket, assignments), Mongo (activity feed), Redis (live presence/typing, SLA timer push). Build this one incrementally.
- **Customer portal vs internal app** could share one Next.js app with route groups (above) or be split into two apps in the monorepo (`apps/web` + `apps/portal`) if you want separate deploy/scaling — worth deciding before it grows.
- **Invite flow** (`/accept-invite/[token]`) — you flagged token flow/pending invite editing as unresolved; this route depends on that design.
