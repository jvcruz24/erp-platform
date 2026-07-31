import { z } from 'zod';
import {
  memberSchema,
  ticketSchema,
  columnSchema,
  createTicketInputSchema,
  assignTicketInputSchema,
  moveTicketInputSchema,
  createColumnInputSchema,
  renameColumnInputSchema,
} from './schemas';

// Previously `Ticket`/`Column`/`Member` were hand-written interfaces that
// happened to match `sanitizePlainText`'s rules by convention. Deriving them
// from the schemas instead means the type and the validator can never
// silently drift apart — change a schema, the type updates automatically,
// and TS will flag every place that now breaks.
export type Member = z.infer<typeof memberSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type Column = z.infer<typeof columnSchema>;
export type Priority = Ticket['priority'];

export type CreateTicketInput = z.infer<typeof createTicketInputSchema>;
export type AssignTicketInput = z.infer<typeof assignTicketInputSchema>;
export type MoveTicketInput = z.infer<typeof moveTicketInputSchema>;
export type CreateColumnInput = z.infer<typeof createColumnInputSchema>;
export type RenameColumnInput = z.infer<typeof renameColumnInputSchema>;

export const PRIORITY_META: Record<Priority, { label: string; dot: string }> = {
  LOW: { label: 'Low', dot: 'bg-slate-400' },
  MEDIUM: { label: 'Medium', dot: 'bg-blue-500' },
  HIGH: { label: 'High', dot: 'bg-orange-500' },
  URGENT: { label: 'Urgent', dot: 'bg-red-500' },
};

// ── Repository contract (Dependency Inversion) ───────────────────────────
// Every method takes the *input* type (validated shape a mutation accepts)
// and resolves the *entity* type. Implementations (in-memory, API-backed)
// are still free to re-validate with the same schemas before touching
// storage — client-side parsing is UX, never the security boundary.
export interface BoardRepository {
  load(): Promise<Column[]>;
  listMembers(): Promise<Member[]>;
  createTicket(input: CreateTicketInput): Promise<Ticket>;
  deleteTicket(columnId: string, ticketId: string): Promise<void>;
  assignTicket(input: AssignTicketInput): Promise<void>;
  moveTicket(input: MoveTicketInput): Promise<void>;
  createColumn(input: CreateColumnInput): Promise<Column>;
  renameColumn(input: RenameColumnInput): Promise<void>;
  deleteColumn(columnId: string): Promise<void>;
}
