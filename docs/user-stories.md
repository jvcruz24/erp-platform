# User Stories — Enterprise Ticketing/ERP Platform

Organized by epic, mapped to the roles defined in your RBAC model (CUSTOMER, AGENT, MANAGER, ADMIN) and the architecture in `architecture.md`. Each story follows `As a [role], I want [goal], so that [reason]` with acceptance criteria in Given/When/Then form where it adds clarity.

---

## Epic 1: Onboarding & Tenant Setup

**US-1.1 — Sign up and create a tenant**
As a prospective customer, I want to sign up and automatically create a new tenant workspace, so that my company gets an isolated environment.
- Given a new user submits the signup form, when they confirm their email, then a `Tenant` record and their `User` record (role: ADMIN) are created together in one transaction.
- Given signup succeeds, then the user is redirected to plan selection, not directly into the app.

**US-1.2 — Select a plan**
As a new tenant admin, I want to choose a subscription plan during onboarding, so that my SLA policies and feature limits are set correctly from day one.
- Given a plan is selected, then a `SlaPolicy` set is seeded for that tenant based on plan tier (P0–P3 mapped per plan, per your priority-badge system).

**US-1.3 — Invite teammates**
As a tenant ADMIN, I want to invite teammates by email with an assigned role, so that my team can start working without me creating accounts manually.
- Given an invite is sent, then an `InviteToken` is created with `tenantId`, `email`, `role`, and `expiresAt`.
- Given the invite link is opened after expiry, then the user sees an "expired invite" state and can request a new one.
- Given the invite is consumed, then `consumedAt` is set and the token cannot be reused.

**US-1.4 — Accept an invite**
As an invited teammate, I want to accept an invite and set my password, so that I can join my company's existing tenant with the correct role.
- Given a valid invite token, when the user completes signup, then their `User.tenantId` and `User.role` are set from the token, not user input.

---

## Epic 2: Ticket Submission (Customer-facing)

**US-2.1 — Submit a ticket**
As a CUSTOMER, I want to submit a support ticket with a description, priority, and attachments, so that my issue gets tracked and routed.
- Given a ticket is submitted, then it's created with `status: OPEN`, `tenantId` scoped to the customer's tenant, and an SLA policy resolved immediately based on priority + plan.
- Given the ticket is created, then Bull delayed jobs for `sla:warning` and `sla:breach` are scheduled.

**US-2.2 — Track ticket status**
As a CUSTOMER, I want to see real-time status updates on my ticket, so that I don't have to email support to ask "any update?"
- Given an agent changes ticket status, then the customer's portal view updates via WebSocket without a page refresh.

**US-2.3 — Reply to a ticket**
As a CUSTOMER, I want to add a comment/reply to my open ticket, so that I can provide additional information.
- Given a reply is added, then existing SLA response-window jobs are cancelled/rescheduled per the reply-triggers-reset rule in the SLA engine.

---

## Epic 3: Ticket Handling (Internal — AGENT/MANAGER)

**US-3.1 — View assigned queue**
As an AGENT, I want to see a list of tickets assigned to me, sorted by SLA urgency, so that I work on the highest-risk items first.

**US-3.2 — Claim/assign a ticket**
As an AGENT, I want to claim an unassigned ticket or have a MANAGER assign one to me, so that ownership is always clear.
- Given a ticket is reassigned, then an audit event (`ACTION: REASSIGNED`) is queued to MongoDB and a WebSocket `ticket:assigned` event is emitted to the relevant tenant room.

**US-3.3 — Change ticket status**
As an AGENT, I want to move a ticket through states (OPEN → IN_PROGRESS → RESOLVED → CLOSED), so that progress is visible to the customer and my manager.
- Given a status change, then it's written to the `events` collection with `before`/`after` state, and the write happens via the queue, not inline in the request.

**US-3.4 — Track time on a ticket**
As an AGENT, I want to start/stop a timer while working a ticket, so that time is logged for billing/reporting without manual entry.
- Given a timer is stopped, then a `time_entries` document is written with `durationSec` computed server-side (not trusted from client).

**US-3.5 — Receive SLA warnings**
As an AGENT, I want a real-time notification when a ticket is close to breaching SLA, so that I can act before it breaches.
- Given the `sla:warning` job fires at 80% elapsed, then a WebSocket event is pushed to the assigned agent and the ticket is visually flagged.

---

## Epic 4: SLA & Escalation (MANAGER)

**US-4.1 — View SLA breach dashboard**
As a MANAGER, I want a real-time dashboard of tickets approaching or past SLA breach, so that I can reallocate resources before customers are impacted.

**US-4.2 — Reassign at-risk tickets**
As a MANAGER, I want to bulk-reassign tickets from an overloaded agent, so that SLA breaches are minimized during staffing gaps.

**US-4.3 — Configure SLA policies**
As a MANAGER (or ADMIN), I want to edit response/resolution time targets per priority level, so that SLA commitments match our actual support contracts.
- Given an `SlaPolicy` is edited, then it only affects tickets created after the change (existing tickets keep their originally-resolved targets) — this is a data-integrity decision worth stating explicitly in the story so engineering doesn't retroactively reshuffle live SLA timers.

---

## Epic 5: Reporting & Admin (ADMIN)

**US-5.1 — View audit trail for a ticket**
As an ADMIN, I want to see the full history of changes to a ticket (status, assignment, comments), so that I can investigate disputes or compliance questions.

**US-5.2 — Export time-tracking reports**
As an ADMIN, I want to export time entries by agent/ticket/date range as CSV, so that I can bill clients or evaluate team capacity.

**US-5.3 — Manage team roles**
As an ADMIN, I want to change a teammate's role or deactivate their account, so that access stays current as the team changes.
- Given a user is deactivated, then their active sessions are invalidated and they can no longer authenticate, but their historical audit/time-tracking records remain intact (never hard-delete for compliance reasons).

**US-5.4 — Cross-tenant platform view (super-admin only)**
As a platform super-admin, I want to view aggregate metrics across all tenants (ticket volume, breach rates, churn signals), so that I can support platform operations.
- Given a super-admin performs a cross-tenant query, then that access is itself logged to the audit trail — the one exception to normal tenant isolation, and it must be traceable.

---

## Epic 6: Security & Access Control (cross-cutting)

**US-6.1 — Enforce tenant isolation**
As the platform, I need every query to be scoped to the requesting user's tenant, so that no tenant can ever see another tenant's data, even via a developer mistake.
- Given a request is missing tenant context, then the `TenantInterceptor` rejects it before it reaches a resolver/service.

**US-6.2 — Enforce role-based permissions**
As the platform, I need endpoints to check both role and tenant scope independently, so that a compromised or misconfigured guard on one axis doesn't silently grant access on the other.

**US-6.3 — Rate-limit customer-facing endpoints**
As the platform, I need stricter rate limits on CUSTOMER-role endpoints than internal ones, so that the public-facing ticket submission surface can't be used to abuse the system.

---

## Suggested prioritization for your build order

Given your architecture's build order (§12), the stories map roughly like this:

| Sprint | Stories |
|---|---|
| 1 | US-1.1, US-1.2, US-6.1, US-6.2 (tenant model + RLS is the foundation) |
| 2 | US-1.3, US-1.4 (invite flow) |
| 3 | US-2.1, US-3.1, US-3.2, US-3.3 (core ticket lifecycle) |
| 4 | US-4.3, US-2.1's SLA hook, US-3.5, US-4.1 (SLA engine) |
| 5 | US-2.2, US-3.2's WS event, US-4.1's real-time feed (WebSocket layer) |
| 6 | US-3.4, US-5.2 (time tracking) |
| 7 | US-5.1, US-3.3's audit write (audit trail) |
| 8 | US-5.3, US-5.4, US-6.3 (admin + hardening) |

---

*Want these broken down further into engineering tasks/subtasks for a specific epic, or turned into GitHub issues format?*
