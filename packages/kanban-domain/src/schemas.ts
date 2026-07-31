import { z } from 'zod';

export const TITLE_MAX_LENGTH = 200;
export const COLUMN_NAME_MAX_LENGTH = 60;

// ── Field-level schemas ──────────────────────────────────────────────────
// Reused everywhere a title/name is accepted, so the rule lives in exactly
// one place: apps/kanban's form, apps/api's route handler, and the
// in-memory repo all import the SAME schema instead of re-implementing
// "trim, non-empty, max length" three times with three chances to drift.

export const ticketTitleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(
    TITLE_MAX_LENGTH,
    `Title must be ${TITLE_MAX_LENGTH} characters or fewer`,
  );

export const columnNameSchema = z
  .string()
  .trim()
  .min(1, 'Column name is required')
  .max(
    COLUMN_NAME_MAX_LENGTH,
    `Column name must be ${COLUMN_NAME_MAX_LENGTH} characters or fewer`,
  );

export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// ── Entity schemas ────────────────────────────────────────────────────────
// These describe what a Ticket/Column/Member IS, wherever it came from
// (DB row, API response, optimistic client state).

export const memberSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  initials: z.string().min(1).max(3),
});

export const ticketSchema = z.object({
  id: z.string().min(1),
  title: ticketTitleSchema,
  priority: prioritySchema,
  assigneeId: z.string().min(1).nullable(),
});

export const columnSchema = z.object({
  id: z.string().min(1),
  name: columnNameSchema,
  tickets: z.array(ticketSchema),
});

// ── Input schemas ─────────────────────────────────────────────────────────
// What a *mutation* accepts, as opposed to what an entity looks like once
// stored. Kept separate from the entity schemas above because inputs are
// intentionally narrower (e.g. you can't set a ticket's id on create).

export const createTicketInputSchema = z.object({
  columnId: z.string().min(1),
  title: ticketTitleSchema,
});

export const assignTicketInputSchema = z.object({
  columnId: z.string().min(1),
  ticketId: z.string().min(1),
  assigneeId: z.string().min(1).nullable(),
});

export const moveTicketInputSchema = z.object({
  ticketId: z.string().min(1),
  toColumnId: z.string().min(1),
  toIndex: z.number().int().nonnegative(),
});

export const createColumnInputSchema = z.object({
  name: columnNameSchema,
});

export const renameColumnInputSchema = z.object({
  columnId: z.string().min(1),
  name: columnNameSchema,
});
