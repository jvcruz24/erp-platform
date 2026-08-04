import { z } from 'zod';

export const TITLE_MAX_LENGTH = 200;
export const COLUMN_NAME_MAX_LENGTH = 60;
export const BOARD_NAME_MAX_LENGTH = 80;

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

export const boardNameSchema = z
  .string()
  .trim()
  .min(1, 'Board name is required')
  .max(
    BOARD_NAME_MAX_LENGTH,
    `Board name must be ${BOARD_NAME_MAX_LENGTH} characters or fewer`,
  );

export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

// ── Entity schemas ────────────────────────────────────────────────────────
// These describe what a Board/Ticket/Column/Member IS, wherever it came
// from (DB row, API response, optimistic client state).

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

// A lightweight summary — id + name only — for board-list views that
// shouldn't need to load every column/ticket just to render a list of
// board names. `boardSchema` (the full shape, with columns) is what a
// single board's page loads.
export const boardSummarySchema = z.object({
  id: z.string().min(1),
  name: boardNameSchema,
});

export const boardSchema = boardSummarySchema.extend({
  columns: z.array(columnSchema),
});

// ── Input schemas ─────────────────────────────────────────────────────────
// What a *mutation* accepts, as opposed to what an entity looks like once
// stored. Every ticket/column-level input now carries `boardId` — tickets
// and columns belong to a specific board, not to one implicit global board,
// so every mutation needs to say which board it's scoped to (this is also
// what a real API route would use to check the caller actually has access
// to that board, once auth exists).

export const createBoardInputSchema = z.object({
  name: boardNameSchema,
});

export const renameBoardInputSchema = z.object({
  boardId: z.uuidv7(),
  name: boardNameSchema,
});

export const createTicketInputSchema = z.object({
  boardId: z.uuidv7(),
  columnId: z.string().min(1),
  title: ticketTitleSchema,
});

export const assignTicketInputSchema = z.object({
  boardId: z.uuidv7(),
  columnId: z.string().min(1),
  ticketId: z.string().min(1),
  assigneeId: z.string().min(1).nullable(),
});

export const moveTicketInputSchema = z.object({
  boardId: z.uuidv7(),
  ticketId: z.string().min(1),
  toColumnId: z.string().min(1),
  toIndex: z.number().int().nonnegative(),
});

export const createColumnInputSchema = z.object({
  boardId: z.uuidv7(),
  name: columnNameSchema,
});

export const renameColumnInputSchema = z.object({
  boardId: z.uuidv7(),
  columnId: z.string().min(1),
  name: columnNameSchema,
});
