import {
  BoardRepository,
  Column,
  Member,
  Ticket,
  CreateTicketInput,
  AssignTicketInput,
  MoveTicketInput,
  CreateColumnInput,
  RenameColumnInput,
  createTicketInputSchema,
  assignTicketInputSchema,
  moveTicketInputSchema,
  createColumnInputSchema,
  renameColumnInputSchema,
  generateId,
} from '@repo/kanban-domain';
import { parseOrThrow } from '@repo/kanban-domain';

const MEMBERS: Member[] = [
  { id: 'u1', name: 'Alex Rivera', initials: 'AR' },
  { id: 'u2', name: 'Priya Nair', initials: 'PN' },
  { id: 'u3', name: 'Sam Cho', initials: 'SC' },
];

const seedColumns = (): Column[] => [
  {
    id: 'c1',
    name: 'Backlog',
    tickets: [
      {
        id: 't1',
        title: 'Set up RLS policies on ticket table',
        priority: 'MEDIUM',
        assigneeId: null,
      },
      {
        id: 't2',
        title: 'Wire dnd-kit into board view',
        priority: 'LOW',
        assigneeId: 'u2',
      },
    ],
  },
  {
    id: 'c2',
    name: 'In Progress',
    tickets: [
      {
        id: 't3',
        title: 'Fix shadcn exports map ordering',
        priority: 'HIGH',
        assigneeId: 'u1',
      },
    ],
  },
  {
    id: 'c3',
    name: 'Done',
    tickets: [
      {
        id: 't4',
        title: 'Flatten apps/web/kanban to apps/kanban',
        priority: 'URGENT',
        assigneeId: 'u3',
      },
    ],
  },
];

/**
 * Every mutation re-validates with the exact same schema apps/api would use
 * for its request body. That's the point of centralizing schemas in
 * @repo/kanban-domain: this in-memory repo and a real DB-backed one enforce
 * identical rules, and neither has to trust that the caller already
 * validated (client-side parsing is UX only, never the security boundary).
 */
export class InMemoryBoardRepository implements BoardRepository {
  private columns: Column[] = seedColumns();

  async load(): Promise<Column[]> {
    return structuredClone(this.columns);
  }

  async listMembers(): Promise<Member[]> {
    return structuredClone(MEMBERS);
  }

  async createTicket(input: CreateTicketInput): Promise<Ticket> {
    const { columnId, title } = parseOrThrow(createTicketInputSchema, input);
    const column = this.requireColumn(columnId);
    const ticket: Ticket = {
      id: generateId('t'),
      title,
      priority: 'MEDIUM',
      assigneeId: null,
    };
    column.tickets.push(ticket);
    return ticket;
  }

  async deleteTicket(columnId: string, ticketId: string): Promise<void> {
    const column = this.requireColumn(columnId);
    column.tickets = column.tickets.filter((t) => t.id !== ticketId);
  }

  async assignTicket(input: AssignTicketInput): Promise<void> {
    const { columnId, ticketId, assigneeId } = parseOrThrow(
      assignTicketInputSchema,
      input,
    );
    if (assigneeId !== null && !MEMBERS.some((m) => m.id === assigneeId)) {
      throw new Error('Unknown assignee');
    }
    const column = this.requireColumn(columnId);
    const ticket = column.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new Error('Ticket not found');
    ticket.assigneeId = assigneeId;
  }

  async moveTicket(input: MoveTicketInput): Promise<void> {
    const { ticketId, toColumnId, toIndex } = parseOrThrow(
      moveTicketInputSchema,
      input,
    );
    let moved: Ticket | undefined;
    for (const col of this.columns) {
      const idx = col.tickets.findIndex((t) => t.id === ticketId);
      if (idx !== -1) {
        [moved] = col.tickets.splice(idx, 1);
        break;
      }
    }
    if (!moved) throw new Error('Ticket not found');
    const target = this.requireColumn(toColumnId);
    const clampedIndex = Math.max(0, Math.min(toIndex, target.tickets.length));
    target.tickets.splice(clampedIndex, 0, moved);
  }

  async createColumn(input: CreateColumnInput): Promise<Column> {
    const { name } = parseOrThrow(createColumnInputSchema, input);
    const column: Column = { id: generateId('c'), name, tickets: [] };
    this.columns.push(column);
    return column;
  }

  async renameColumn(input: RenameColumnInput): Promise<void> {
    const { columnId, name } = parseOrThrow(renameColumnInputSchema, input);
    this.requireColumn(columnId).name = name;
  }

  async deleteColumn(columnId: string): Promise<void> {
    this.columns = this.columns.filter((c) => c.id !== columnId);
  }

  private requireColumn(columnId: string): Column {
    const column = this.columns.find((c) => c.id === columnId);
    if (!column) throw new Error('Column not found');
    return column;
  }
}
